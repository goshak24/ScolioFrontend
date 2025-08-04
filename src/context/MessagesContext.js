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

// Cache keys and TTL values
const CONVERSATIONS_CACHE_KEY = 'conversations_data';
const MESSAGES_CACHE_PREFIX = 'messages_conversation_';
const CONVERSATIONS_TTL = 30 * 60 * 1000; // 30 minutes
const MESSAGES_TTL = 10 * 60 * 1000; // 10 minutes
const MESSAGES_PER_PAGE = 20; // Initial load count

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

// Helper function to get the current user ID safely
const getCurrentUserId = async () => {
  // Try to get from AsyncStorage
  const userId = await AsyncStorage.getItem('userId');
  return userId; // Just return what we have - let calling code handle missing IDs
};

const messagesReducer = (state, action) => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      console.log(`🔄 SET_CONVERSATIONS: ${action.payload.length} conversations`);
      return {
        ...state,
        conversations: action.payload,
        loading: false,
        error: null
      };
    case "SET_CURRENT_CONVERSATION":
      console.log(`🔄 SET_CURRENT_CONVERSATION: ${action.payload.id}`);
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          ...action.payload,
        },
        error: null
      };
    case "SET_MESSAGES":
      // Only skip update if the message count AND the last message ID are exactly the same
      const lastOldMessage = state.messages[state.messages.length - 1];
      const lastNewMessage = action.payload[action.payload.length - 1];
      
      if (state.messages.length === action.payload.length && 
          lastOldMessage?.id === lastNewMessage?.id) {
        console.log(`⏭️ SET_MESSAGES: Skipping update, same message count and last message (${action.payload.length})`);
        return state; // Return the same state reference to prevent re-render
      }
      console.log(`🔄 SET_MESSAGES: Updated with ${action.payload.length} messages`);
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
        console.log(`⏭️ ADD_MESSAGE: Skipping duplicate message ${action.payload.id}`);
        return state; // Return the same state reference to prevent re-render
      }
      
      console.log(`➕ ADD_MESSAGE: Adding new message ${action.payload.id}`);
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
        console.log(`⏭️ ADD_OLDER_MESSAGES: No new messages to add`);
        return {
          ...state,
          loadingOlderMessages: false
        };
      }
      
      console.log(`➕ ADD_OLDER_MESSAGES: Adding ${newMessages.length} older messages`);
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

// Get initial messages for a conversation (used for backwards compatibility and initial loading)
const getMessages = (dispatch) => async (otherUserId, forceFetch = false, offset = 0, limit = MESSAGES_PER_PAGE, currentUserId = null) => {
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
    
    // Check if we have cached data that's valid (only if not force fetching)
    if (!forceFetch) {
      const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { messages, timestamp } = JSON.parse(cachedData);
          
          // Only use cache if it's still valid
          if (now - timestamp < MESSAGES_TTL) {
            console.log(`📋 Using cached messages for conversation with ${otherUserId}`);
            
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
            
            console.log(`✅ Loaded ${processedMessages.length} cached messages`);
            
            // Setup Firebase listener after loading cached data - only if not already set up
            if (!activeListeners[conversationId]) {
              console.log(`🔄 Setting up Firebase listener for cached data`);
              setupMessageListener(dispatch, () => ({}))(conversationId, currentUserId);
            } else {
              console.log(`♻️ Firebase listener already active for this conversation`);
            }
            
            return processedMessages;
          } else {
            console.log(`🕐 Messages cache expired, will fetch fresh data`);
          }
        } catch (e) {
          console.error("❌ Error parsing cached messages:", e);
          // Continue to fetch from server if cache parsing fails
        }
      }
    } else {
      console.log("🔄 Force refreshing messages data");
    }
    
    // Fetch initial messages from API (this provides the base data for Firebase listener)
    console.log(`🔄 Fetching initial messages from API for conversation`);
    const response = await api.get(`/messages/conversation/${otherUserId}?limit=${limit}&offset=${offset}`);
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
    
    console.log(`✅ Loaded ${processedMessages.length} initial messages`);
    
    // Setup Firebase listener for real-time updates - only if not already set up
    if (!activeListeners[conversationId]) {
      console.log(`🔄 Setting up Firebase listener for real-time updates`);
      setupMessageListener(dispatch, () => ({}))(conversationId, currentUserId);
    } else {
      console.log(`♻️ Firebase listener already active for this conversation`);
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

// Get older messages
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
    
    // Get current offset
    const offset = (messageCache[conversationId]?.length || 0);
    
    // Fetch older messages from API
    console.log(`Fetching older messages for conversation with ${otherUserId}, offset: ${offset}`);
    const response = await api.get(`/messages/conversation/${otherUserId}?limit=${MESSAGES_PER_PAGE}&offset=${offset}`);
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
    const hasMore = processedMessages.length === MESSAGES_PER_PAGE;
    dispatch({ type: "SET_HAS_MORE_MESSAGES", payload: hasMore });
    
    // Update pagination state
    paginationState[conversationId] = {
      offset: offset + processedMessages.length,
      hasMore,
      loading: false
    };
    
    return processedMessages;
  } catch (error) {
    console.error("Error fetching older messages:", error);
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
  // Create temp message ID
  const tempId = `temp_${Date.now()}`;
  
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
      status: 'sending'
    };
    
    // Immediately add to state for a responsive UI
    dispatch({ type: "ADD_MESSAGE", payload: tempMessage });
    
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

// Setup a listener for new messages in the current conversation
const setupMessageListener = (dispatch, getState) => async (conversationId, userId) => {
  try {
    if (!db) {
      console.error("❌ Firestore not initialized");
      return () => {};
    }

    if (!userId) {
      console.warn("❌ No user ID provided");
      dispatch({
        type: "SET_ERROR",
        payload: "User ID required for message updates"
      });
      return () => {};
    }

    // Extract the other user ID from the conversation ID
    const otherUserId = conversationId.split('_').find(id => id !== userId);
    
    if (!otherUserId) {
      console.error("❌ Could not determine other user ID from conversation ID");
      dispatch({
        type: "SET_ERROR",
        payload: "Invalid conversation ID"
      });
      return () => {};
    }

    // CRITICAL: Verify backend token and setup Firebase Auth for Firestore
    const authResult = await verifyBackendTokenAndSetupFirebase();
    
    if (!authResult.success) {
      console.error("❌ Auth verification failed:", authResult.error);
      dispatch({
        type: "SET_ERROR",
        payload: "Authentication required for real-time updates"
      });
      return () => {};
    }
    
    // Verify the backend user matches the expected user
    if (authResult.backendUserId !== userId) {
      console.error(`❌ User ID mismatch`);
      dispatch({
        type: "SET_ERROR",
        payload: "User authentication mismatch"
      });
      return () => {};
    }
    
    // IMPORTANT: Track this as the active conversation
    setActiveConversation(conversationId);
    
    // Check if there's already an active listener for this conversation
    if (activeListeners[conversationId]) {
      console.log(`♻️ Reusing existing listener`);
      
      return () => {
        if (activeListeners[conversationId]) {
          activeListeners[conversationId]();
          delete activeListeners[conversationId];
        }
      };
    }
    
    console.log(`🚀 Setting up Firestore listener for conversation: ${conversationId}`);
    
    // Create a Firestore query for messages in this conversation
    // ORDER BY DESC to get newest messages first, then we'll reverse for display
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'desc'),
      limit(50)  // Get most recent 50 messages for real-time updates
    );
    
    console.log(`📋 Query configured: conversation=${conversationId}, user=${userId}`);
    
    // Set up the real-time listener
    const unsubscribe = onSnapshot(
      messagesQuery,
      {
        includeMetadataChanges: true // Include all changes for real-time updates
      },
      (snapshot) => {
        try {
          // Check if this is from server or cache
          const source = snapshot.metadata.fromCache ? "cache" : "server";
          console.log(`🔔 Firebase listener triggered! ${snapshot.docs.length} messages from ${source}`);
          
          // Only continue if this is still the active conversation
          if (listenerDetails.currentConversationId !== conversationId) {
            console.log(`⏭️ Skipping update - different conversation active`);
            return;
          }
          
          // Process all messages from the snapshot and reverse for chronological order
          const allMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              isOwn: data.senderId === userId,
              status: 'sent',
              // Convert Firestore timestamp to expected format
              timestamp: data.timestamp?.seconds ? {
                _seconds: data.timestamp.seconds,
                _nanoseconds: data.timestamp.nanoseconds || 0
              } : data.timestamp
            };
          }).reverse(); // Reverse because Firestore query is DESC, but we want ASC for display
          
          // Always update messages in real-time (don't check against cache)
          // This ensures we get immediate updates when new messages arrive
          console.log(`📨 Firebase listener: ${allMessages.length} messages from Firestore`);
          
          // Update the message cache with all messages
          messageCache[conversationId] = allMessages;
          
          // Update AsyncStorage cache
          try {
            const cacheKey = `${MESSAGES_CACHE_PREFIX}${otherUserId}`;
            AsyncStorage.setItem(cacheKey, JSON.stringify({
              messages: allMessages,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("❌ Cache error:", e);
          }
          
          // ALWAYS update the messages in state for real-time updates
          console.log(`🚀 Dispatching ${allMessages.length} messages to React state`);
          dispatch({ type: "SET_MESSAGES", payload: allMessages });
        } catch (error) {
          console.error("❌ Snapshot error:", error);
        }
      },
      (error) => {
        console.error("❌ Firestore listener error:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Real-time message updates temporarily unavailable"
        });
      }
    );
    
    // Store the unsubscribe function
    activeListeners[conversationId] = unsubscribe;
    
    console.log(`✅ Firebase real-time listener ACTIVE for conversation: ${conversationId}`);
    
    // Return the cleanup function
    return () => {
      if (activeListeners[conversationId]) {
        activeListeners[conversationId]();
        delete activeListeners[conversationId];
      }
    };
      
  } catch (error) {
    console.error("❌ Setup error:", error);
    dispatch({
      type: "SET_ERROR",
      payload: "Failed to setup real-time message updates"
    });
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
      console.log(`Cleaning up listener for ${conversationId}`);
      activeListeners[conversationId]();
      delete activeListeners[conversationId];
    }
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