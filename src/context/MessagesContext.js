import createDataContext from "./createDataContext";
import api, { auth, verifyBackendTokenAndSetupFirebase } from "../utilities/backendApi";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  getDocs, 
  startAfter, 
  startAt, 
  Timestamp, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  and
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { getApp } from "firebase/app";
import AsyncStorage from "@react-native-async-storage/async-storage";
import userCache from "../utilities/userCache";

// Cache keys and TTL values (MAXIMUM efficiency caching)
const CONVERSATIONS_CACHE_KEY = 'conversations_data';
const MESSAGES_CACHE_PREFIX = 'messages_conversation_';
const CONVERSATIONS_TTL = 30 * 60 * 1000; // 30 minutes
const MESSAGES_TTL = 48 * 60 * 60 * 1000; // 48 HOURS - cache messages for very long time
const MESSAGES_PER_PAGE = 10; // Reduced to 10 to minimize reads
const FRESH_CACHE_THRESHOLD = 5 * 60 * 1000; // 5 minutes - don't setup listeners if cache is this fresh

// Use the existing Firebase app instance from backendApi instead of creating a new one
let db;
try {
  // Get the existing Firebase app instance
  const app = getApp();
  // Get Firestore from the existing app
  db = getFirestore(app);
  
  // Enable offline persistence with a custom cache size (20MB)
  enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    .then(() => {
      console.log("Firebase offline persistence enabled successfully");
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn("Multiple tabs open, offline persistence unavailable");
      } else if (err.code === 'unimplemented') {
        console.warn("Current browser doesn't support offline persistence");
      } else {
        console.error("Error enabling offline persistence:", err);
      }
    });
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

// Track cached messages by conversation ID
const messageCache = {};

// Track pagination state for conversations
const paginationState = {};

// Track last seen timestamp per conversation to avoid duplicate reads
const lastSeenTimestamps = {};

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
      // Fast comparison - only skip if exact same array reference or same length + last message
      if (state.messages === action.payload || 
          (state.messages.length === action.payload.length && 
           state.messages.length > 0 &&
           state.messages[state.messages.length - 1]?.id === action.payload[action.payload.length - 1]?.id)) {
        return state; // Return the same state reference to prevent re-render
      }
      
      return {
        ...state,
        messages: action.payload,
        loading: false,
        error: null
      };
    case "ADD_MESSAGE":
      // Check if this message already exists (check both ID and clientMessageId)
      const isDuplicate = state.messages.some(message => 
        message.id === action.payload.id ||
        (action.payload.clientMessageId && message.clientMessageId === action.payload.clientMessageId)
      );
      
      if (isDuplicate) {
        return state; // Return the same state reference to prevent re-render
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
      
      // If no new messages, return same state reference
      if (newMessages.length === 0) {
        return {
          ...state,
          loadingOlderMessages: false
        };
      }
      
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
      // Check if message exists and status is different
      const messageToUpdate = state.messages.find(message => message.id === action.payload.id);
      if (!messageToUpdate || messageToUpdate.status === action.payload.status) {
        return state; // Return same state if no change needed
      }
      
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
      // Check if the temp message exists
      const hasTempMessage = state.messages.some(message => message.id === action.payload.tempId);
      if (!hasTempMessage) {
        return state; // Return same state if the temp message doesn't exist
      }
      
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
      if (state.loading === action.payload) {
        return state; // Return same state if loading state hasn't changed
      }
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      if (state.error === action.payload) {
        return state; // Return same state if error hasn't changed
      }
      return { ...state, error: action.payload, loading: false };
    case "SET_UNREAD_COUNT":
      if (state.unreadCount === action.payload) {
        return state; // Return same state if unread count hasn't changed
      }
      return {
        ...state,
        unreadCount: action.payload
      };
    case "SET_HAS_MORE_MESSAGES":
      if (state.hasMoreMessages === action.payload) {
        return state; // Return same state if hasMoreMessages hasn't changed
      }
      return {
        ...state,
        hasMoreMessages: action.payload
      };
    case "DELETE_CONVERSATION":
      if (state.conversations.some(conversation => conversation.id === action.payload)) {
        return {
          ...state,
          conversations: state.conversations.filter(conversation => conversation.id !== action.payload)
        };
      }
      return state;
    case "MARK_CONVERSATION_AS_READ":
      return {
        ...state,
        conversations: state.conversations.map(conversation =>
          conversation.id === action.payload.conversationId ? 
            { ...conversation, unreadCount: 0 } : 
            conversation
        )
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
    
    // Only force refresh if it's been a while since last refresh
    const shouldForceRefresh = forceFetch;
    
    // Check if we have cached data that's valid
    if (!shouldForceRefresh) {
      const cachedData = await AsyncStorage.getItem(CONVERSATIONS_CACHE_KEY);
      if (cachedData) {
        try {
          const { data, timestamp, cachedUserId } = JSON.parse(cachedData);
          
          // Only use cache if it's for the current user and still valid
          if (cachedUserId === userId && now - timestamp < CONVERSATIONS_TTL) {
            
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
            console.log(`Cache expired or user changed`);
          }
        } catch (e) {
          console.error("Error parsing cached conversations:", e);
          // Continue to fetch from server if cache parsing fails
        }
      }
    } else {
      console.log("Force refreshing conversations data");
    }
    
    console.log("🔄 Fetching conversations from backend...");
    const response = await api.get("/messages/conversations");
    console.log("✅ Conversations fetched successfully");
    const conversations = response.data.conversations || [];
    
    // Cache user data from conversations
    conversations.forEach(conversation => {
      if (conversation.user?.id) {
        userCache.cacheUser(conversation.user);
      }
    });
    
    dispatch({ type: "SET_CONVERSATIONS", payload: conversations });
    
    // Cache the new data
    try {
      await AsyncStorage.setItem(CONVERSATIONS_CACHE_KEY, JSON.stringify({
        data: conversations,
        timestamp: now,
        cachedUserId: userId
      }));
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

// Get initial messages for a conversation (ULTRA-EFFICIENT - MINIMAL FIREBASE READS)
const getMessages = (dispatch) => async (otherUserId, forceFetch = false, _offset = 0, limit = MESSAGES_PER_PAGE, currentUserId = null) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    if (!otherUserId) {
      console.warn("No other user ID provided for getMessages");
      dispatch({ 
        type: "SET_ERROR", 
        payload: "Other user ID is required to fetch messages" 
      });
      return [];
    }
    
    // Get current user ID if not provided
    if (!currentUserId) {
      currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        dispatch({ 
          type: "SET_ERROR", 
          payload: "User ID is required to fetch messages" 
        });
        return [];
      }
    }
    
    // Create conversation ID consistently
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    
    // Set the current conversation in state
    dispatch({
      type: "SET_CURRENT_CONVERSATION",
      payload: {
        id: conversationId,
        otherUserId
      }
    });
    
    // Set active conversation for listener management
    listenerDetails.currentConversationId = conversationId;
    listenerDetails.lastNavigateTime = Date.now();
    
    const now = new Date().getTime();
    
    // Check if we have cached data (VERY aggressive caching - almost never expire)
    if (!forceFetch) {
      const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { messages, timestamp } = JSON.parse(cachedData);
          
          // Cache expires after 24 hours (very long TTL)
          if (now - timestamp < MESSAGES_TTL) {
            console.log(`📋 Using cached messages (${messages.length} messages) - expires in ${Math.round((MESSAGES_TTL - (now - timestamp)) / (60 * 60 * 1000))} hours`);
            
            // Process cached messages to add isOwn flag
            const processedMessages = messages.map(message => ({
              ...message,
              isOwn: message.senderId === currentUserId,
              status: 'sent'
            }));
            
            // Update message cache
            messageCache[conversationId] = processedMessages;
            
            dispatch({ type: "SET_MESSAGES", payload: processedMessages });
            dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: processedMessages.length >= MESSAGES_PER_PAGE });
            
            // 🚀 CRITICAL OPTIMIZATION: Only setup Firebase listener if cache is older than 5 minutes
            const cacheAge = now - timestamp;
            
            if (cacheAge > FRESH_CACHE_THRESHOLD && !activeListeners[conversationId]) {
              console.log(`🔗 Cache is ${Math.round(cacheAge / 60000)} min old - setting up listener for new messages`);
              // Delay listener setup by 2 seconds to batch operations and prevent rapid setups
              setTimeout(() => {
                if (!activeListeners[conversationId] && listenerDetails.currentConversationId === conversationId) {
                  setupMessageListener(dispatch, () => ({}))(conversationId, currentUserId);
                }
              }, 2000);
            } else if (cacheAge <= FRESH_CACHE_THRESHOLD) {
              console.log(`⚡ Cache is fresh (${Math.round(cacheAge / 1000)}s old) - NO Firebase listener needed`);
            } else {
              console.log(`⚠️ Firebase listener already exists for: ${conversationId}`);
            }
            
            return processedMessages;
          } else {
            console.log(`🕐 Messages cache expired after 24 hours - will fetch fresh data`);
          }
        } catch (e) {
          console.error("❌ Error parsing cached messages:", e);
          // Continue to fetch from server if cache parsing fails
        }
      }
    } else {
      console.log("🔄 Force refreshing messages data (explicit force fetch)");
    }
    
    // Fetch initial messages ONCE from API (REDUCED LIMIT - cache for 24 hours)
    console.log(`📥 Loading initial messages from API (LIMIT: ${MESSAGES_PER_PAGE}) - will cache for 24 hours`);
    const response = await api.get(`/messages/conversation/${otherUserId}?limit=${MESSAGES_PER_PAGE}`);
    const messages = response.data.messages || [];
    
    // Process messages to add isOwn flag
    const processedMessages = messages.map(message => ({
      ...message,
      isOwn: message.senderId === currentUserId,
      status: 'sent'
    }));
    
    // Update the cache
    messageCache[conversationId] = processedMessages;
    
    // Cache the messages
    try {
      const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify({
        messages: processedMessages,
        timestamp: now
      }));
    } catch (e) {
      console.error("❌ Error caching messages:", e);
      // Continue even if caching fails
    }
    
    dispatch({ type: "SET_MESSAGES", payload: processedMessages });
    dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: processedMessages.length >= MESSAGES_PER_PAGE });
    
    // Setup Firebase listener for NEW messages only - ONLY after fresh API fetch with delay
    if (!activeListeners[conversationId]) {
      console.log(`🔗 Setting up Firebase listener after fresh API fetch: ${conversationId}`);
      // Delay listener setup by 1 second to let the API response settle
      setTimeout(() => {
        if (!activeListeners[conversationId] && listenerDetails.currentConversationId === conversationId) {
          setupMessageListener(dispatch, () => ({}))(conversationId, currentUserId);
        }
      }, 1000);
    } else {
      console.log(`⚠️ Firebase listener already exists for: ${conversationId}`);
    }
    
    return processedMessages;
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to fetch messages"
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Get older messages (ULTRA-EFFICIENT - MINIMAL PAGINATION)
const getOlderMessages = (dispatch) => async (otherUserId, currentUserId) => {
  try {
    if (!currentUserId) {
      dispatch({ 
        type: "SET_ERROR", 
        payload: "Current user ID is required to fetch older messages" 
      });
      return [];
    }
    
    // Set loading state for older messages
    dispatch({ type: "SET_LOADING_OLDER_MESSAGES", payload: true });
    
    // Create conversation ID consistently
    const conversationId = [currentUserId, otherUserId].sort().join('_');
    
    // Initialize pagination state if needed
    if (!paginationState[conversationId]) {
      paginationState[conversationId] = {
        offset: 0,
        hasMore: true,
        loading: false
      };
    }
    
    // Determine oldest timestamp in current list to paginate by time
    const existing = messageCache[conversationId] || [];
    let oldestTimestampMs = null;
    if (existing.length > 0) {
      const oldest = existing[0];
      const sec = oldest?.timestamp?._seconds || oldest?.timestamp?.seconds || null;
      const nsec = oldest?.timestamp?._nanoseconds || oldest?.timestamp?.nanoseconds || 0;
      if (sec !== null) {
        oldestTimestampMs = (sec * 1000) + Math.floor((nsec || 0) / 1e6);
      } else if (oldest?.timestamp) {
        const d = new Date(oldest.timestamp);
        if (!isNaN(d.getTime())) oldestTimestampMs = d.getTime();
      }
    }
    
    // Use MINIMAL limit for older messages to reduce reads
    const OLDER_MESSAGES_LIMIT = 8; // Only 8 older messages at a time
    
    // Fetch older messages from API (MINIMAL LIMIT)
    const query = oldestTimestampMs ? `&timestamp=${oldestTimestampMs}` : '';
    console.log(`📤 Fetching older messages: limit=${OLDER_MESSAGES_LIMIT}${query ? `, timestamp=${oldestTimestampMs}` : ''}`);
    const response = await api.get(`/messages/conversation/${otherUserId}?limit=${OLDER_MESSAGES_LIMIT}${query}`);
    const messages = response.data.messages || [];
    
    // Process messages to add isOwn flag
    const processedMessages = messages.map(message => ({
      ...message,
      isOwn: message.senderId === currentUserId,
      status: 'sent'
    }));
    
    // Update state with older messages
    dispatch({ type: "ADD_OLDER_MESSAGES", payload: processedMessages });
    
    // Update has more flag based on response
    const hasMore = processedMessages.length === OLDER_MESSAGES_LIMIT;
    dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: hasMore });
    
    // Update pagination state (timestamp-based)
    paginationState[conversationId] = {
      lastOldestTimestampMs: oldestTimestampMs,
      hasMore,
      loading: false
    };
    
    console.log(`✅ Loaded ${processedMessages.length} older messages (hasMore: ${hasMore})`);
    
    return processedMessages;
  } catch (error) {
    console.error("❌ Error fetching older messages:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to fetch older messages"
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING_OLDER_MESSAGES", payload: false });
  }
};

// Send a message
const sendMessage = (dispatch) => async (receiverId, content, currentUserId) => {
  // Create temp message ID with more uniqueness to prevent collisions
  const tempId = `temp_${currentUserId}_${receiverId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!currentUserId) {
      throw new Error("User ID is required to send messages");
    }
    
    // Sort user IDs to create consistent conversation ID
    const conversationId = [currentUserId, receiverId].sort().join('_');
    
    // Create a temporary message to show immediately (optimistic update)
    const tempMessage = {
      id: tempId,
      content,
      senderId: currentUserId,
      receiverId,
      conversationId,
      timestamp: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
      isOwn: true,
      status: 'sending',
      clientMessageId: tempId // Include clientMessageId for tracking
    };
    
    // Check if this message already exists in cache to prevent duplicates
    const existingMessages = messageCache[conversationId] || [];
    const isDuplicate = existingMessages.some(msg => msg.id === tempId);
    
    if (!isDuplicate) {
      // Immediately add to state for a responsive UI
      dispatch({ type: "ADD_MESSAGE", payload: tempMessage });
    }
    
    // Send the message to the server
    const response = await api.post("/messages", {
      receiverId,
      content
    });
    
    // Check if we received a valid message back
    if (response.data && response.data.message) {
      const serverMessage = {
        ...response.data.message,
        isOwn: true,
        status: 'sent'
      };
      
      // Replace the temporary message with the server one
      dispatch({
        type: "REPLACE_TEMP_MESSAGE",
        payload: {
          tempId,
          message: serverMessage
        }
      });
      
      // Return success with the message
      return { success: true, message: serverMessage };
    } else {
      // Update the temporary message to show it failed
      dispatch({
        type: "UPDATE_MESSAGE_STATUS",
        payload: {
          id: tempId,
          status: 'failed'
        }
      });
      
      return { success: false, error: "No message returned from server" };
    }
  } catch (error) {
    console.error("Error sending message:", error);
    
    // Update the temporary message to show it failed
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
  }
};

// Setup a listener ONLY for NEW messages (MAXIMUM EFFICIENCY - ZERO WASTED READS)
const setupMessageListener = (dispatch, getState) => async (conversationId, userId) => {
  try {
    if (!db) {
      console.error("❌ Firestore not initialized");
      return () => {};
    }

    if (!userId) {
      console.warn("❌ No user ID provided");
      return () => {};
    }

    // Extract the other user ID from the conversation ID
    const otherUserId = conversationId.split('_').find(id => id !== userId);
    
    if (!otherUserId) {
      console.error("❌ Could not determine other user ID from conversation ID");
      return () => {};
    }

    // 🚫 PREVENT DUPLICATE LISTENERS AT ALL COSTS
    if (activeListeners[conversationId]) {
      console.log(`🚫 DUPLICATE LISTENER PREVENTED for: ${conversationId}`);
      return () => {
        if (activeListeners[conversationId]) {
          activeListeners[conversationId]();
          delete activeListeners[conversationId];
        }
      };
    }

    // CRITICAL: Verify backend token and setup Firebase Auth for Firestore
    const authResult = await verifyBackendTokenAndSetupFirebase();
    
    if (!authResult.success) {
      console.error("❌ Auth verification failed:", authResult.error);
      return () => {};
    }
    
    // Verify the backend user matches the expected user
    if (authResult.backendUserId !== userId) {
      console.error(`❌ User ID mismatch`);
      return () => {};
    }
    
    // IMPORTANT: Track this as the active conversation
    setActiveConversation(conversationId);
    
    // 🎯 ULTRA-PRECISE TIMESTAMP FILTERING: Get the exact latest message timestamp
    const existingMessages = messageCache[conversationId] || [];
    let lastMessageTimestamp = lastSeenTimestamps[conversationId] || null;
    
    // If we don't have a stored timestamp, get it from existing messages with NANOSECOND precision
    if (!lastMessageTimestamp && existingMessages.length > 0) {
      const lastMessage = existingMessages[existingMessages.length - 1];
      lastMessageTimestamp = lastMessage.timestamp?.seconds || lastMessage.timestamp?._seconds || null;
      
      // Store this timestamp to avoid re-reading
      if (lastMessageTimestamp) {
        lastSeenTimestamps[conversationId] = lastMessageTimestamp;
      }
    }
    
    // Create ULTRA-PRECISE query that gets ONLY BRAND NEW messages
    const messagesRef = collection(db, 'messages');
    let messagesQuery;
    
    if (lastMessageTimestamp) {
      // 🎯 CRITICAL: Use milliseconds + 1ms to ensure we NEVER re-read the same message
      const timestampObj = Timestamp.fromMillis((lastMessageTimestamp * 1000) + 1);
      messagesQuery = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        where('timestamp', '>', timestampObj), // CRITICAL: Only get messages AFTER this exact timestamp
        orderBy('timestamp', 'asc'),
        limit(5) // ULTRA-MINIMAL: Only 5 new messages at a time
      );
      console.log(`🎯 ULTRA-PRECISE: Listening for messages AFTER ${new Date((lastMessageTimestamp * 1000) + 1).toISOString()}`);
    } else {
      // No existing messages - listen for any new ones, but ULTRA-LIMITED
      messagesQuery = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc'),
        limit(3) // ULTRA-MINIMAL: Only 3 messages for initial query
      );
      console.log(`🎯 ULTRA-PRECISE: Listening for ANY new messages (no cache) - LIMITED to 3`);
    }
    
    // Set up the real-time listener (ONLY NEW MESSAGES)
    const unsubscribe = onSnapshot(
      messagesQuery,
      {
        includeMetadataChanges: false // CRITICAL: Only server changes, ignore local changes
      },
      (snapshot) => {
        try {
          // Only continue if this is still the active conversation
          if (listenerDetails.currentConversationId !== conversationId) {
            return;
          }
          
          // 🚀 MAXIMUM EFFICIENCY: Only process 'added' changes to avoid re-processing
          const newMessages = [];
          let latestTimestamp = lastSeenTimestamps[conversationId];
          
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();
              const messageTimestamp = data.timestamp?.seconds || data.timestamp?._seconds;
              
              // ULTRA-STRICT: Only process if this is truly newer than our last seen timestamp
              if (!latestTimestamp || messageTimestamp > latestTimestamp) {
                newMessages.push({
                  id: change.doc.id,
                  ...data,
                  isOwn: data.senderId === userId,
                  status: 'sent',
                  timestamp: data.timestamp?.seconds ? {
                    _seconds: data.timestamp.seconds,
                    _nanoseconds: data.timestamp.nanoseconds || 0
                  } : data.timestamp
                });
                
                // Update latest timestamp
                if (messageTimestamp > (latestTimestamp || 0)) {
                  latestTimestamp = messageTimestamp;
                }
              }
            }
          });
          
          // Update last seen timestamp to prevent re-processing
          if (latestTimestamp) {
            lastSeenTimestamps[conversationId] = latestTimestamp;
          }
          
          if (newMessages.length > 0) {
            console.log(`🆕 ${newMessages.length} NEW messages (Firebase reads: ${snapshot.size})`);
            
            // Get existing messages from cache
            const existingMessages = messageCache[conversationId] || [];
            
            // ULTRA-STRICT: Filter out any duplicates to prevent key conflicts
            const existingIds = new Set(existingMessages.map(msg => msg.id));
            const trulyNewMessages = newMessages.filter(msg => msg.id && !existingIds.has(msg.id));
            
            if (trulyNewMessages.length > 0) {
              // Append ONLY truly new messages to existing ones (chronological order)
              const updatedMessages = [...existingMessages, ...trulyNewMessages];
              
              // Update cache and state
              messageCache[conversationId] = updatedMessages;
              
              // Update AsyncStorage cache (background operation)
              AsyncStorage.setItem(`${MESSAGES_CACHE_PREFIX}${otherUserId}`, JSON.stringify({
                messages: updatedMessages,
                timestamp: Date.now()
              })).catch(() => {}); // Silent fail for cache
              
              // Update the messages in state
              dispatch({ type: "SET_MESSAGES", payload: updatedMessages });
              
              console.log(`✅ Added ${trulyNewMessages.length} new messages (total: ${updatedMessages.length})`);
            }
          }
        } catch (error) {
          console.error("❌ Snapshot processing error:", error);
        }
      },
      (error) => {
        console.error("❌ Firestore listener error:", error);
        // Clean up failed listener
        if (activeListeners[conversationId]) {
          delete activeListeners[conversationId];
        }
      }
    );
    
    // Store the unsubscribe function
    activeListeners[conversationId] = unsubscribe;
    console.log(`✅ ULTRA-EFFICIENT Firebase listener created for: ${conversationId}`);
    
    // Return the cleanup function
    return () => {
      if (activeListeners[conversationId]) {
        activeListeners[conversationId]();
        delete activeListeners[conversationId];
        console.log(`🧹 Cleaned up Firebase listener for: ${conversationId}`);
      }
    };
      
  } catch (error) {
    console.error("❌ Setup error:", error);
    return () => {}; // Return empty cleanup function
  }
};

// Clear current conversation
const clearCurrentConversation = (dispatch) => () => {
  try {
    console.log("Clearing current conversation state");
    
    // Get the current conversation ID before clearing it
    const currentConversationId = listenerDetails.currentConversationId;
    
    // Clean up Firebase listener for the current conversation
    if (currentConversationId && activeListeners[currentConversationId]) {
      console.log(`🧹 Cleaning up Firebase listener for conversation: ${currentConversationId}`);
      try {
        activeListeners[currentConversationId]();
        delete activeListeners[currentConversationId];
        console.log(`✅ Firebase listener cleaned up successfully`);
      } catch (cleanupError) {
        console.error("❌ Error cleaning up Firebase listener:", cleanupError);
      }
    }
    
    // Clear the current conversation ID
    listenerDetails.currentConversationId = null;
    
    dispatch({ type: "CLEAR_CURRENT_CONVERSATION" });
  } catch (error) {
    console.error("Error clearing current conversation:", error);
    dispatch({ type: "CLEAR_CURRENT_CONVERSATION" });
  }
};

// Start a conversation
const startConversation = (dispatch) => async (receiverId, initialMessage) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Send the first message to initialize the conversation
    const messageResponse = initialMessage 
      ? await api.post("/messages", { receiverId, content: initialMessage })
      : await api.post("/messages/conversations", { receiverId });
    
    // Set the current conversation
    const currentUserId = await getCurrentUserId();
    const conversationId = [currentUserId, receiverId].sort().join('_');
    
    // Update the state with the conversation
    dispatch({
      type: "SET_CURRENT_CONVERSATION",
      payload: {
        id: conversationId,
        otherUserId: receiverId
      }
    });
    
    // If we have a message response, add it to the state
    if (messageResponse.data.message) {
      const newMessage = {
        ...messageResponse.data.message,
        isOwn: true,
        status: 'sent'
      };
      
      dispatch({ type: "ADD_MESSAGE", payload: newMessage });
    }
    
    // Invalidate conversations cache
    await AsyncStorage.removeItem(CONVERSATIONS_CACHE_KEY);
    
    // Setup message listener for real-time updates
    setupMessageListener(dispatch, () => ({}))(conversationId, currentUserId);
    
    return { success: true };
  } catch (error) {
    console.error("Error starting conversation:", error);
    dispatch({
      type: "SET_ERROR",
      payload: error.response?.data?.message || "Failed to start conversation"
    });
    return { success: false, error: error.response?.data?.message || "Failed to start conversation" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Get unread message count
const getUnreadMessageCount = (dispatch) => async () => {
  try {
    const response = await api.get("/messages/unread/count");
    const count = response.data.count || 0;
    
    dispatch({ type: "SET_UNREAD_COUNT", payload: count });
    
    return count;
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    // Don't set an error state for this non-critical feature
    return 0;
  }
};

// Helper function to set the active conversation
const setActiveConversation = (conversationId) => {
  listenerDetails.currentConversationId = conversationId;
  listenerDetails.lastNavigateTime = Date.now();
};

// Clean up all active listeners
const stopAllActiveListeners = () => {
  Object.keys(activeListeners).forEach(conversationId => {
    if (typeof activeListeners[conversationId] === 'function') {
      console.log(`🧹 Cleaning up listener for ${conversationId}`);
      activeListeners[conversationId]();
      delete activeListeners[conversationId];
    }
  });
  
  // Clear last seen timestamps when stopping listeners
  Object.keys(lastSeenTimestamps).forEach(key => {
    delete lastSeenTimestamps[key];
  });
};

// Clear all caches and optionally stop listeners
const clearCache = (dispatch) => async (clearListeners = false) => {
  try {
    // If requested, stop all active listeners first
    if (clearListeners || clearListeners === 'all_listeners') {
      console.log("🧹 Stopping all active Firebase listeners");
      stopAllActiveListeners();
      
      // Clear conversation tracking
      listenerDetails.currentConversationId = null;
      listenerDetails.lastNavigateTime = 0;
    }
    
    // Clear AsyncStorage caches
    const keys = await AsyncStorage.getAllKeys();
    const messageCacheKeys = keys.filter(key => 
      key === CONVERSATIONS_CACHE_KEY || key.startsWith(MESSAGES_CACHE_PREFIX)
    );
    
    await AsyncStorage.multiRemove(messageCacheKeys);
    
    // Clear in-memory caches
    Object.keys(messageCache).forEach(key => {
      delete messageCache[key];
    });
    
    // Clear pagination state
    Object.keys(paginationState).forEach(key => {
      delete paginationState[key];
    });
    
    // Clear last seen timestamps
    Object.keys(lastSeenTimestamps).forEach(key => {
      delete lastSeenTimestamps[key];
    });
    
    console.log(`✅ Cleared ${messageCacheKeys.length} cache items and ${clearListeners ? 'stopped listeners' : 'kept listeners active'}`);
    
    return true;
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    return false;
  }
};

const deleteConversationById = (dispatch) => async (conversationId) => {
  try {
    await api.delete(`/messages/conversation/delete/${conversationId}`);
    dispatch({ type: "DELETE_CONVERSATION", payload: conversationId });
    
    // Clean up associated caches and listeners
    if (activeListeners[conversationId]) {
      activeListeners[conversationId]();
      delete activeListeners[conversationId];
    }
    
    delete messageCache[conversationId];
    delete paginationState[conversationId];
    delete lastSeenTimestamps[conversationId];
    
    return true;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    dispatch({ type: "SET_ERROR", payload: "Failed to delete conversation" });
    return false;
  }
};

// Mark messages as read
const markMessagesAsRead = (dispatch) => (conversationId, userId) => {
  try {
    console.log(`📖 Marking messages as read for conversation: ${conversationId}`);
    
    // Update local state to remove unread count immediately
    dispatch({ 
      type: "MARK_CONVERSATION_AS_READ", 
      payload: { conversationId } 
    });
    
    console.log(`✅ Messages marked as read in local state`);
    return true;
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return false;
  }
};

export const { Provider, Context } = createDataContext(
  messagesReducer,
  {
    getConversations,
    getMessages,
    sendMessage,
    setupMessageListener,
    clearCurrentConversation,
    startConversation,
    getUnreadMessageCount,
    getOlderMessages,
    clearCache,
    deleteConversationById,
    markMessagesAsRead
  },
  {
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,
    error: null,
    unreadCount: 0,
    hasMoreMessages: true,
    loadingOlderMessages: false
  }
);