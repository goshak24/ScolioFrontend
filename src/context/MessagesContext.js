import createDataContext from "./createDataContext";
import api, { auth } from "../utilities/backendApi";
import { getFirestore, collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { getApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userCache from "../utilities/userCache";

// Cache keys and TTL values
const CONVERSATIONS_CACHE_KEY = 'conversations_data';
const MESSAGES_CACHE_PREFIX = 'messages_conversation_';
const CONVERSATIONS_TTL = 30 * 60 * 1000; // 30 minutes
const MESSAGES_TTL = 10 * 60 * 1000; // 10 minutes
const RECENT_CACHE_THRESHOLD = 30 * 1000; // Consider cache "recent" if less than 30 seconds old
const FORCE_REFRESH_INTERVAL = 2 * 60 * 1000; // Force refresh after 2 minutes of inactivity

// Number of messages to fetch per page and polling limits
const MESSAGES_PER_PAGE = 20; // Initial load count
const POLLING_INTERVAL = 4000; // 7 seconds between polls
const POLLING_LIMIT = 2; // Only fetch up to 5 new messages per poll
const FORCED_SYNC_INTERVAL = 300000; // Force full sync every 5 minutes

// Track last refresh time to prevent unnecessary forced refreshes
const lastRefreshTimes = {
  conversations: 0,
  messages: {},
  lastDbFetch: {},   // Track when we last fetched from the database
  lastFullSync: {}   // Track when we last did a full sync for each conversation
};

// Use the existing Firebase app instance from backendApi instead of creating a new one
let db;
try {
  // Get the existing Firebase app instance
  const app = getApp();
  // Get Firestore from the existing app
  db = getFirestore(app);
} catch (error) {
  console.error("Error getting Firebase app instance:", error);
}

// Track active listeners to prevent duplicates
const activeListeners = {};

// Store listener details for better cleanup
const listenerDetails = {
  currentConversationId: null, // Track the current conversation ID
  lastNavigateTime: 0          // Track when we last navigated
};

// Track active listener timeouts for auto-cleanup
const listenerTimeouts = {};

// Track listener activity timestamps
const listenerActivity = {};

// Maximum number of active listeners to avoid excessive connections
const MAX_ACTIVE_LISTENERS = 3;

// Track cached messages by conversation ID
const messageCache = {};

// Track pagination state for conversations
const paginationState = {};

// Create a request tracker to prevent duplicate API calls
const pendingRequests = {
  conversations: new Map(),
  messages: new Map(),
  initialFetch: new Set()
};

// Track when conversations were last accessed (for optimized polling)
const conversationLastAccessed = {};

// Helper function to get the current user ID safely
const getCurrentUserId = async () => {
  // Try to get from AsyncStorage
  const userId = await AsyncStorage.getItem('userId');
  return userId; // Just return what we have - let calling code handle missing IDs
};

const messagesReducer = (state, action) => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload,
        loading: false,
        error: null
      };
    case "SET_CURRENT_CONVERSATION":
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          ...action.payload,
        },
        error: null
      };
    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
        loading: false,
        error: null
      };
    case "ADD_MESSAGE":
      // Check if this message already exists
      const isDuplicate = state.messages.some(message => 
        message.id === action.payload.id
      );
      
      if (isDuplicate) {
        return state;
      }
      
      return {
        ...state,
        messages: [...state.messages, action.payload],
        error: null
      };
    case "ADD_OLDER_MESSAGES":
      // Filter out any duplicates and add at the beginning
      const existingIds = new Set(state.messages.map(msg => msg.id));
      const newMessages = action.payload.filter(msg => !existingIds.has(msg.id));
      
      return {
        ...state,
        messages: [...newMessages, ...state.messages],
        error: null,
        loadingOlderMessages: false
      };
    case "SET_LOADING_OLDER_MESSAGES":
      return {
        ...state,
        loadingOlderMessages: action.payload
      };
    case "UPDATE_MESSAGE_STATUS":
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id ? 
            { ...message, status: action.payload.status } : 
            message
        ),
        error: null
      };
    case "REPLACE_TEMP_MESSAGE":
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.tempId ? 
            { ...action.payload.message, status: 'sent' } : 
            message
        ),
        error: null
      };
    case "CLEAR_CURRENT_CONVERSATION":
      return {
        ...state,
        currentConversation: null,
        messages: [],
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_UNREAD_COUNT":
      return {
        ...state,
        unreadCount: action.payload
      };
    case "SET_HAS_MORE_MESSAGES":
      return {
        ...state,
        hasMoreMessages: action.payload
      };
    default:
      return state;
  }
};

// Get all conversations for the current user
const getConversations = (dispatch) => async (userId, forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    if (!userId) {
      console.warn("No user ID provided for getConversations");
      dispatch({ 
        type: "SET_ERROR", 
        payload: "User ID is required to fetch conversations" 
      });
      return [];
    }
    
    const now = new Date().getTime();
    const timeSinceLastRefresh = now - lastRefreshTimes.conversations;
    
    // Only force refresh if it's been a while since last refresh
    const shouldForceRefresh = forceFetch && timeSinceLastRefresh > FORCE_REFRESH_INTERVAL;
    
    // Check if we have cached data that's valid
    if (!shouldForceRefresh) {
      const cachedData = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
    if (cachedData) {
      try {
        const { data, timestamp, cachedUserId } = JSON.parse(cachedData);
        
          // Only use cache if it's for the current user and still valid
          if (cachedUserId === userId && now - timestamp < CONVERSATIONS_TTL) {
          console.log(`Using cached conversations for user ${userId}`);
            
            // Cache user data from conversations
            data.forEach(conversation => {
              if (conversation.user?.id) {
                userCache.cacheUser(conversation.user);
              }
            });
            
          dispatch({ type: "SET_CONVERSATIONS", payload: data });
            
            // If the cache is getting old but still valid, refresh in the background
            const shouldRefreshInBackground = now - timestamp > (CONVERSATIONS_TTL / 2);
            if (shouldRefreshInBackground) {
              console.log("Cache getting stale, refreshing conversations in background");
              setTimeout(() => {
                getConversations(dispatch)(userId, true);
              }, 100);
            }
            
          return data;
        } else {
          console.log(`Cache expired or user changed, fetching new data for ${userId}`);
        }
      } catch (e) {
        console.error("Error parsing cached conversations:", e);
        // Continue to fetch from server if cache parsing fails
      }
      }
    } else {
      console.log("Force refreshing conversations data");
    }
    
    console.log(`Fetching conversations from API for user ${userId}`);
    const response = await api.get("/messages/conversations");
    const conversations = response.data.conversations || [];
    
    // Cache user data from conversations
    conversations.forEach(conversation => {
      if (conversation.user?.id) {
        userCache.cacheUser(conversation.user);
      }
    });
    
    dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    
    // Cache the new data with user ID
    const cacheData = {
      data: conversations,
      timestamp: now,
      cachedUserId: userId
    };
    
    try {
      await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify(cacheData));
      console.log(`Cached ${conversations.length} conversations for user ${userId}`);
      
      // Update last refresh time
      lastRefreshTimes.conversations = now;
    } catch (e) {
      console.error("Error caching conversations:", e);
      // Continue even if caching fails
    }
    
    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to fetch conversations"
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Get messages for a specific conversation
const getMessages = (dispatch) => async (otherUserId, forceFetch = false, offset = 0, limit = MESSAGES_PER_PAGE, currentUserId = null) => {
  try {
    // Check for duplicate requests
    const requestKey = `${otherUserId}_${offset}`;
    const now = Date.now();
    const lastRequest = pendingRequests.messages.get(requestKey);
    
    // If there's a duplicate request in progress (within last 2 seconds), skip this one
    if (lastRequest && now - lastRequest < 2000 && !forceFetch) {
      console.log(`Skipping duplicate request for ${requestKey}, last request was ${now - lastRequest}ms ago`);
      return [];
    }
    
    // Mark this request as in progress
    pendingRequests.messages.set(requestKey, now);
    
    if (offset === 0) {
      dispatch({ type: "SET_LOADING", payload: true });
    } else {
      dispatch({ type: "SET_LOADING_OLDER_MESSAGES", payload: true });
    }
    
    if (!otherUserId) {
      throw new Error("Other user ID is required");
    }
    
    // Create a unique conversation ID
    let userId = currentUserId;
    
    // If no userId provided, try to get from AsyncStorage as fallback
    if (!userId) {
      userId = await getCurrentUserId();
    }
    
    if (!userId) {
      console.error("Cannot determine current user ID");
      dispatch({ 
        type: "SET_ERROR", 
        payload: "User ID is required for messaging" 
      });
      
      dispatch({ type: "SET_LOADING", payload: false });
      return [];
    }
    
    const conversationId = [userId, otherUserId].sort().join('_');
    
    // IMPORTANT: Mark this as the active conversation for tracking
    setActiveConversation(conversationId);
    
    // First, stop ALL active listeners to avoid duplicates
    if (offset === 0) {
      stopAllActiveListeners();
    }
    
    // Update conversation access time
    conversationLastAccessed[conversationId] = now;
    
    // Initialize pagination state if needed
    if (!paginationState[conversationId]) {
      paginationState[conversationId] = {
        hasMore: true,
        oldestTimestamp: null,
        totalLoaded: 0
      };
    }
    
    const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
    
    // Check if we should use cache
    if (offset === 0) {
      // Get time of last DB fetch for this conversation
      const lastDbFetchTime = lastRefreshTimes.lastDbFetch[conversationId] || 0;
      const timeSinceLastDbFetch = now - lastDbFetchTime;
      
      // Check if we recently fetched from DB (within cache threshold) - if so, use cache
      if (timeSinceLastDbFetch < RECENT_CACHE_THRESHOLD && !forceFetch) {
        try {
          // Try to get cached messages
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            const { messages, otherUserDetails, timestamp } = JSON.parse(cachedData);
            
            // Use the cached data
            console.log(`Using cached messages for conversation with ${otherUserId} (recent fetch: ${timeSinceLastDbFetch/1000}s ago)`);
            
            // Update memory cache
            messageCache[conversationId] = messages;
            
            // Set the conversation data in state
            dispatch({ type: "SET_MESSAGES", payload: messages });
            dispatch({
              type: "SET_CURRENT_CONVERSATION",
              payload: {
                id: conversationId,
                otherUserId,
                otherUserDetails: otherUserDetails || null
              }
            });
            
            // Update loading state
            dispatch({ type: "SET_LOADING", payload: false });
            
            // Cache user data if available
            if (otherUserDetails) {
              userCache.cacheUser({
                id: otherUserId,
                ...otherUserDetails
              });
            }
            
            // Clean up request tracking
            pendingRequests.messages.delete(requestKey);
            
            return messages;
          }
        } catch (e) {
          console.error("Error parsing cached messages:", e);
          // Continue to fetch if cache fails
        }
      }
    }
    
    // Need to fetch from API
    console.log(`Fetching messages for conversation with ${otherUserId}`);
    
    // Prepare API request with pagination
    let apiUrl = `/messages/conversation/${otherUserId}?limit=${limit}`;
    
    // Add timestamp for pagination if we're loading older messages
    if (offset > 0 && paginationState[conversationId].oldestTimestamp) {
      apiUrl += `&timestamp=${paginationState[conversationId].oldestTimestamp}`;
    }
    
    console.log(`Fetching messages from API: ${apiUrl}`);
    const response = await api.get(apiUrl);
    const messages = response.data.messages || [];
    const otherUserDetails = response.data.otherUserDetails || null;
    const paginationInfo = response.data.pagination || {};
    
    // Record that we just fetched from DB
    lastRefreshTimes.lastDbFetch[conversationId] = Date.now();
    
    // Store userId for future use
    await AsyncStorage.setItem('userId', userId);
    
    // Update pagination state
    if (messages.length > 0) {
      // Find the oldest message timestamp for next pagination
      const timestamps = messages.map(m => 
        m.timestamp?._seconds ? m.timestamp._seconds * 1000 : 
        m.timestamp?.seconds ? m.timestamp.seconds * 1000 : 0
      );
      
      if (timestamps.length > 0) {
        const oldestTime = Math.min(...timestamps);
        paginationState[conversationId].oldestTimestamp = oldestTime;
        paginationState[conversationId].totalLoaded += messages.length;
        paginationState[conversationId].hasMore = paginationInfo.hasMore !== false;
      }
    } else {
      // No messages returned, likely no more
      paginationState[conversationId].hasMore = false;
    }
    
    // Update state based on fetch type
    if (offset === 0) {
      dispatch({ type: "SET_MESSAGES", payload: messages });
      
      // Update current conversation
      dispatch({
        type: "SET_CURRENT_CONVERSATION",
        payload: {
          id: conversationId,
          otherUserId,
          otherUserDetails
        }
      });
      
      // Update in-memory cache
      messageCache[conversationId] = messages;
      
      // Cache to AsyncStorage
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          messages,
          otherUserDetails,
          timestamp: now
        }));
      } catch (e) {
        console.error("Error caching messages:", e);
      }
    } else {
      // Pagination - add older messages to beginning
      dispatch({ type: "ADD_OLDER_MESSAGES", payload: messages });
    }
    
    // Update hasMore in state
    dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: paginationState[conversationId].hasMore });
    
    // If we have otherUserDetails, update the user cache
    if (otherUserDetails) {
      userCache.cacheUser({
        id: otherUserId,
        ...otherUserDetails
      });
    }
    
    dispatch({ type: "SET_LOADING", payload: false });
    pendingRequests.messages.delete(requestKey);
    
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to fetch messages"
    });
    
    // Clean up request tracking on error
    pendingRequests.messages.delete(requestKey);
    
    dispatch({ type: "SET_LOADING", payload: false });
    return [];
  }
};

// Get older messages for pagination
const getOlderMessages = (dispatch) => async (otherUserId, currentUserId) => {
  try {
    if (!currentUserId) {
      console.error("Cannot determine current user ID for pagination");
      dispatch({ 
        type: "SET_ERROR", 
        payload: "User ID is required to load more messages" 
      });
      return [];
    }
    
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    
    // Check if we have pagination state
    if (!paginationState[conversationId] || !paginationState[conversationId].hasMore) {
      dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: false });
      return [];
    }
    
    // Calculate offset based on how many we've loaded so far
    const offset = paginationState[conversationId].totalLoaded;
    
    // Fetch older messages with user ID
    return await getMessages(dispatch)(otherUserId, false, offset, MESSAGES_PER_PAGE, currentUserId);
  } catch (error) {
    console.error("Error loading older messages:", error);
    return [];
  }
};

// Send a new message
const sendMessage = (dispatch) => async (receiverId, content, currentUserId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Create a temporary ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    
    // Make sure we have a currentUserId
    if (!currentUserId) {
      throw new Error("Missing user ID - cannot send message");
    }
    
    // Create a timestamp for the temporary message
    const now = new Date();
    const tempTimestamp = {
      _seconds: Math.floor(now.getTime() / 1000),
      _nanoseconds: 0
    };
    
    // Create conversation ID for client-side tracking - note that we don't use this for Firebase security
    const conversationId = [currentUserId, receiverId].sort().join('_');

    // Add temporary message to state immediately for optimistic UI
    const tempMessage = {
      id: tempId,
      senderId: currentUserId,
      receiverId,
      content,
      timestamp: tempTimestamp,
      isOwn: true,
      status: 'sending',
      isTemp: true
    };
    
    // Add to state immediately
    dispatch({
      type: "ADD_MESSAGE",
      payload: tempMessage
    });
    
    // Send to server
    const response = await api.post("/messages", { 
      receiverId, 
      content,
      clientMessageId: tempId
    });
    
    // Get real message data
    const realMessage = {
      ...response.data.message,
      isOwn: true,
      status: 'sent'
    };
    
    // Replace temporary message with real one
    dispatch({
      type: "REPLACE_TEMP_MESSAGE",
      payload: {
        tempId,
        message: realMessage
      }
    });
    
    // Force invalidate conversations cache to show this message in the list
    try {
      await AsyncStorage.removeItem(CONVERSATIONS_CACHE_KEY);
    } catch (err) {
      console.error("Error invalidating conversations cache:", err);
    }
    
    // Note: We don't need to explicitly update the message state or cache
    // The Firestore listener will automatically receive the updated message

    return { success: true, message: realMessage };
  } catch (error) {
    console.error("Error sending message:", error);
    
    // Mark temp message as failed
    dispatch({
      type: "UPDATE_MESSAGE_STATUS",
      payload: {
        id: tempId,
        status: 'failed'
      }
    });
    
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to send message"
    });
    return { success: false, error: error.response?.data?.message || "Failed to send message" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Setup a listener for new messages in the current conversation
const setupMessageListener = (dispatch, getState) => async (conversationId, userId) => {
  try {
    if (!userId) {
      console.warn("No user ID provided");
      dispatch({
        type: "SET_ERROR",
        payload: "User ID required for message updates"
      });
      return () => {};
    }

    // Extract the other user ID from the conversation ID
    const otherUserId = conversationId.split('_').find(id => id !== userId);
    
    if (!otherUserId) {
      console.error("Could not determine other user ID from conversation ID");
      dispatch({
        type: "SET_ERROR",
        payload: "Invalid conversation ID"
      });
      return () => {};
    }
    
    // Record access time for this conversation
    conversationLastAccessed[conversationId] = Date.now();
    
    // IMPORTANT: Track this as the active conversation
    setActiveConversation(conversationId);
    
    console.log(`🔄 Setting up message listener for conversation: ${conversationId}`);
    
    // Check if there's already an active listener for this conversation
    if (activeListeners[conversationId]) {
      console.log(`♻️ Reusing existing polling for conversation ${conversationId}`);
      
      // Return a cleanup function that will properly clear this listener
      return () => {
        console.log(`❌ Stopping polling for conversation ${conversationId}`);
        if (activeListeners[conversationId]) {
          clearInterval(activeListeners[conversationId]);
          delete activeListeners[conversationId];
          console.log(`✅ Listener removed for ${conversationId}`);
        }
      };
    }
    
    // Check if we have messages in cache already
    const hasExistingMessages = messageCache[conversationId] && messageCache[conversationId].length > 0;
    
    // Keep track of the latest message timestamp to avoid duplicate fetches
    let latestMessageTimestamp = 0;
    
    // Initialize with the most recent message timestamp if available
    if (hasExistingMessages) {
      try {
        // Safely get state with fallback
        let messages = [];
        
        try {
          const state = getState();
          if (state && state.messages && Array.isArray(state.messages)) {
            messages = state.messages;
          } else {
            // Fall back to message cache if state doesn't have messages
            messages = messageCache[conversationId] || [];
          }
        } catch (err) {
          console.log("Error accessing state, using message cache instead:", err);
          messages = messageCache[conversationId] || [];
        }
        
        if (messages.length > 0) {
          // Find the latest message timestamp
          const timestamps = messages.map(m => {
            if (m.timestamp?._seconds) return m.timestamp._seconds * 1000;
            if (m.timestamp?.seconds) return m.timestamp.seconds * 1000;
            if (m.timestamp) {
              const date = new Date(m.timestamp);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
          });
          
          latestMessageTimestamp = Math.max(...timestamps, 0);
          console.log(`Initialized polling from timestamp: ${new Date(latestMessageTimestamp).toISOString()}`);
        }
      } catch (err) {
        console.error("Error initializing timestamp:", err);
      }
    }
    
    // Create a request lock to prevent duplicate API calls
    let isRequestInProgress = false;
    
    // Function to fetch new messages
    async function fetchNewMessages() {
      if (isRequestInProgress) {
        return;
      }
      
      try {
        isRequestInProgress = true;
        
        // Verify this listener is still needed (the conversation is still active)
        if (listenerDetails.currentConversationId !== conversationId) {
          console.log(`⚠️ Conversation ${conversationId} is no longer active, stopping polling`);
          
          // Conversation has changed, stop this listener
          if (activeListeners[conversationId]) {
            clearInterval(activeListeners[conversationId]);
            delete activeListeners[conversationId];
          }
          
          isRequestInProgress = false;
          return;
        }
        
        // Different API parameters based on whether this is the first poll
        let apiEndpoint = `/messages/conversation/${otherUserId}`;
        
        // Always use incremental polling with timestamp
        apiEndpoint += `?since=${latestMessageTimestamp}&limit=${POLLING_LIMIT}`;
        console.log(`Polling for new messages: ${apiEndpoint}`);
        
        // Fetch messages from API
        const response = await api.get(apiEndpoint);
        
        // Record DB fetch time
        lastRefreshTimes.lastDbFetch[conversationId] = Date.now();
        
        // Process messages
        const messages = response.data.messages || [];
        
        if (messages.length > 0) {
          console.log(`Received ${messages.length} new messages`);
          
          // Find the latest timestamp
          const timestamps = messages.map(m => {
            if (m.timestamp?._seconds) return m.timestamp._seconds * 1000;
            if (m.timestamp?.seconds) return m.timestamp.seconds * 1000;
            if (m.timestamp) {
              const date = new Date(m.timestamp);
              return isNaN(date.getTime()) ? 0 : date.getTime();
            }
            return 0;
          });
          
          const maxTimestamp = Math.max(...timestamps, latestMessageTimestamp);
          if (maxTimestamp > latestMessageTimestamp) {
            latestMessageTimestamp = maxTimestamp;
          }
          
          // Add isOwn flag to messages
          const processedMessages = messages.map(message => ({
            ...message,
            isOwn: message.senderId === userId,
            status: 'sent'
          }));
          
          // Safely get current state messages with fallback
          let currentMessages = [];
          try {
            const state = getState();
            if (state && state.messages && Array.isArray(state.messages)) {
              currentMessages = state.messages;
            } else {
              currentMessages = messageCache[conversationId] || [];
            }
          } catch (err) {
            console.log("Error accessing state, using message cache:", err);
            currentMessages = messageCache[conversationId] || [];
          }
          
          // Check if we already have these messages
          const existingMessageIds = new Set(currentMessages.map(m => m.id));
          const newMessages = processedMessages.filter(m => !existingMessageIds.has(m.id));
          
          if (newMessages.length > 0) {
            console.log(`Adding ${newMessages.length} new messages to state`);
            
            // Add new messages to state
            newMessages.forEach(message => {
              dispatch({ type: "ADD_MESSAGE", payload: message });
            });
            
            // Update the in-memory cache by combining current messages and new ones
            messageCache[conversationId] = [...currentMessages, ...newMessages];
            
            // Update AsyncStorage cache
            try {
              const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
              await AsyncStorage.setItem(cacheKey, JSON.stringify({
                messages: messageCache[conversationId],
                timestamp: Date.now()
              }));
            } catch (err) {
              console.error("Error updating cache:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error polling messages:", error);
        // If there's an error, continue polling but don't crash
      } finally {
        isRequestInProgress = false;
      }
    }
    
    // Set up polling interval
    console.log(`✅ Starting message polling for conversation ${conversationId}`);
    const pollingInterval = setInterval(fetchNewMessages, POLLING_INTERVAL);
    
    // Store the interval ID for cleanup
    activeListeners[conversationId] = pollingInterval;
    
    // Run first poll soon after setting up
    setTimeout(fetchNewMessages, 500);
    
    // Create an unsubscribe function that ensures proper cleanup
    const unsubscribe = () => {
      console.log(`❌ Stopping polling for conversation ${conversationId}`);
      if (activeListeners[conversationId]) {
        clearInterval(activeListeners[conversationId]);
        delete activeListeners[conversationId];
        console.log(`✅ Listener successfully removed for ${conversationId}`);
      } else {
        console.log(`⚠️ No active listener found for ${conversationId} when trying to unsubscribe`);
      }
    };
    
    // Return the unsubscribe function
    return unsubscribe;
  } catch (error) {
    console.error("Error setting up message polling:", error);
    dispatch({
      type: "SET_ERROR",
      payload: "Failed to setup real-time message updates"
    });
    return () => {}; // Return an empty function as fallback
  }
};

// Clear cached data
const clearCache = dispatch => async (type = 'all') => {
  try {
    // Stop all active listeners
    stopAllActiveListeners();
    
    // Clear the current conversation tracking
    listenerDetails.currentConversationId = null;
    
    // Clear message-related caches in AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const messageCacheKeys = keys.filter(key => 
      key === CONVERSATIONS_CACHE_KEY || 
      key.startsWith(MESSAGES_CACHE_PREFIX)
    );
    
    if (messageCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(messageCacheKeys);
    }
    
    // Clear in-memory message cache
    Object.keys(messageCache).forEach(key => {
      delete messageCache[key];
    });
    
    // Reset last refresh times
    Object.keys(lastRefreshTimes.messages).forEach(key => {
      delete lastRefreshTimes.messages[key];
    });
    Object.keys(lastRefreshTimes.lastDbFetch).forEach(key => {
      delete lastRefreshTimes.lastDbFetch[key];
    });
    lastRefreshTimes.conversations = 0;
    
    // Clear all pending requests
    pendingRequests.conversations.clear();
    pendingRequests.messages.clear();
    pendingRequests.initialFetch.clear();
    
    return true;
  } catch (error) {
    console.error("Error clearing message cache:", error);
    return false;
  }
};

// Clear current conversation when leaving the chat
const clearCurrentConversation = (dispatch) => () => {
  try {
    console.log("🔄 Clearing current conversation state");
    
    // Get the currently active conversation ID from our tracking object
    const currentId = listenerDetails.currentConversationId;
    console.log(`Last active conversation: ${currentId || 'none'}`);
    
    // Force stop ALL active listeners to be absolutely sure
    stopAllActiveListeners();
    
    // Clear the current conversation tracking
    listenerDetails.currentConversationId = null;
    
    // Now clear the UI state
    dispatch({ type: "CLEAR_CURRENT_CONVERSATION" });
  } catch (error) {
    console.error("Error clearing current conversation:", error);
    
    // Force stop all listeners even if we hit an error
    stopAllActiveListeners();
    
    dispatch({ type: "CLEAR_CURRENT_CONVERSATION" });
  }
};

// Start a new conversation with a user
const startConversation = (dispatch) => async (receiverId, initialMessage) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Send the first message to create the conversation
    const response = await api.post("/messages", { 
      receiverId, 
      content: null
    });
    
    // Add the new message to the state
    dispatch({
      type: "ADD_MESSAGE",
      payload: response.data.message
    });
    
    // Set current conversation
    dispatch({
      type: "SET_CURRENT_CONVERSATION",
      payload: {
        otherUserId: receiverId,
      }
    });
    
    dispatch({ type: "SET_LOADING", payload: false });
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error starting conversation:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to start conversation"
    });
    return { success: false, error: error.response?.data?.message || "Failed to start conversation" };
  }
};

// Get unread message count
const getUnreadMessageCount = (dispatch) => async () => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // This endpoint doesn't exist yet - you would need to create it on the backend
    const response = await api.get("/messages/unread/count");
    dispatch({ type: "SET_UNREAD_COUNT", payload: response.data.count });
    
    return response.data.count;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to fetch unread message count"
    });
    return 0;
  }
};

// Helper function to clean up orphaned listeners
const cleanupOrphanedListeners = () => {
  const activeListenerCount = Object.keys(activeListeners).length;
  
  if (activeListenerCount > 0) {
    console.log(`🧹 Checking for orphaned listeners (found ${activeListenerCount})`);
    
    // Get current active conversation
    const currentId = listenerDetails.currentConversationId;
    const lastNavigateTime = listenerDetails.lastNavigateTime;
    const now = Date.now();
    
    // Check how long since we navigated
    const timeSinceNavigate = now - lastNavigateTime;
    if (timeSinceNavigate > 10000) { // 10 seconds
      console.log(`⚠️ Navigation happened ${timeSinceNavigate/1000}s ago, but listeners are still active`);
    }
    
    // Log and clean up any listeners that aren't for the current conversation
    Object.keys(activeListeners).forEach(id => {
      console.log(`   - Active listener: ${id} ${id === currentId ? '(current)' : '(ORPHANED)'}`);
      
      // If this isn't the current conversation, or it's been too long since navigation, clean it up
      if (id !== currentId || timeSinceNavigate > 10000) {
        console.log(`   🧨 Removing orphaned listener: ${id}`);
        try {
          clearInterval(activeListeners[id]);
          delete activeListeners[id];
        } catch (err) {
          console.error(`Error cleaning up listener ${id}:`, err);
        }
      }
    });
  }
};

// Set up periodic cleaner for orphaned listeners (every 30 seconds)
let cleanupInterval = null;

// Start the cleanup interval
const startCleanupInterval = () => {
  if (!cleanupInterval) {
    console.log("🧹 Starting periodic cleanup of orphaned listeners");
    cleanupInterval = setInterval(cleanupOrphanedListeners, 30000);
  }
};

// Stop the cleanup interval
const stopCleanupInterval = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log("🛑 Stopped periodic cleanup of orphaned listeners");
  }
};

// Mark a conversation as active
const setActiveConversation = (conversationId) => {
  if (conversationId) {
    listenerDetails.currentConversationId = conversationId;
    listenerDetails.lastNavigateTime = Date.now();
    console.log(`🏁 Marked conversation as active: ${conversationId}`);
  }
};

// Stop ALL active listeners - used when we can't determine which one to stop
const stopAllActiveListeners = () => {
  const activeCount = Object.keys(activeListeners).length;
  
  if (activeCount > 0) {
    console.log(`🛑 Stopping ALL active listeners (count: ${activeCount})`);
    
    // Stop each listener
    Object.keys(activeListeners).forEach(id => {
      try {
        console.log(`   - Stopping listener for: ${id}`);
        clearInterval(activeListeners[id]);
        delete activeListeners[id];
      } catch (err) {
        console.error(`Error stopping listener for ${id}:`, err);
      }
    });
    
    console.log(`✅ All listeners stopped`);
  } else {
    console.log(`ℹ️ No active listeners to stop`);
  }
};

export const { Provider, Context } = createDataContext(
  messagesReducer,
  {
    getConversations,
    getMessages,
    getOlderMessages,
    sendMessage,
    setupMessageListener: (dispatch, state) => {
      // Create a getState function that always returns the latest state
      const getState = () => state;
      
      // Start the cleanup interval if not already running
      startCleanupInterval();
      
      // Check for any orphaned listeners whenever setting up a new one
      cleanupOrphanedListeners();
      
      return setupMessageListener(dispatch, getState);
    },
    clearCurrentConversation,
    startConversation,
    getUnreadMessageCount,
    clearCache
  },
  {
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    loadingOlderMessages: false,
    hasMoreMessages: true,
    error: null
  }
); 