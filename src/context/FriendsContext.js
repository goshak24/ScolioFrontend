import createDataContext from "./createDataContext";
import api from "../utilities/backendApi";
import userCache from "../utilities/userCache";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys with versioning support
const FRIENDS_CACHE_KEY = 'friends_data_v2';
const FRIEND_IDS_CACHE_KEY = 'friend_ids_data_v2';
const REQUESTS_CACHE_KEY = 'friend_requests_data_v2';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_REFRESH_THRESHOLD = 20 * 60 * 60 * 1000; // 20 hours (stale-while-revalidate)

// Enhanced reducer to handle username data
const friendsReducer = (state, action) => {
  switch (action.type) {
    case "SET_FRIENDS":
      return { 
        ...state, 
        friends: action.payload.friends || action.payload, 
        friendsVersion: action.payload.version || state.friendsVersion,
        loading: false,
        error: null 
      };
    case "SET_FRIEND_IDS":
      return {
        ...state,
        friendIds: action.payload.friendIds || action.payload,
        friendIdsVersion: action.payload.version || state.friendIdsVersion,
        loading: false,
        error: null
      }; 
    case "SET_FRIEND_REQUESTS":
      return { 
        ...state, 
        friendRequests: action.payload.requests || action.payload,
        requestsVersion: action.payload.version || state.requestsVersion,
        loading: false,
        error: null 
      };
    case "UPDATE_FRIENDS_DELTA":
      // Handle delta updates for friends
      if (action.payload.unchanged) {
        return {
          ...state,
          friendsVersion: action.payload.version,
          loading: false
        };
      }
      return {
        ...state,
        friends: action.payload.deltaUpdate ? 
          [...state.friends, ...action.payload.friends] : 
          action.payload.friends,
        friendsVersion: action.payload.version,
        loading: false,
        error: null
      };
    case "UPDATE_REQUESTS_DELTA":
      // Handle delta updates for requests
      if (action.payload.unchanged) {
        return {
          ...state,
          requestsVersion: action.payload.version,
          loading: false
        };
      }
      return {
        ...state,
        friendRequests: action.payload.deltaUpdate ? 
          [...state.friendRequests, ...action.payload.requests] : 
          action.payload.requests,
        requestsVersion: action.payload.version,
        loading: false,
        error: null
      };
    case "ADD_SENT_REQUEST":
      return {
        ...state,
        friendRequests: [
          ...state.friendRequests,
          {
            ...action.payload,
            type: "sent",
            // Ensure we have username data
            user: {
              ...action.payload.user,
              username: action.payload.user?.username || action.payload.receiverUsername || 'Unknown User'
            }
          }
        ],
        loading: false,
        error: null
      };
    case "REMOVE_FRIEND_REQUEST":
      return {
        ...state,
        friendRequests: state.friendRequests.filter(
          request => request.id !== action.payload
        ),
        loading: false,
        error: null
      };
    case "ADD_FRIEND":
      return {
        ...state,
        friends: [...state.friends, action.payload],
        friendIds: [...state.friendIds, action.payload.id],
        loading: false,
        error: null
      };
    case "REMOVE_FRIEND":
      return {
        ...state,
        friends: state.friends.filter(friend => friend.id !== action.payload),
        friendIds: state.friendIds.filter(id => id !== action.payload),
        loading: false,
        error: null
      };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// Get only friend IDs (for optimized fetching with delta updates)
const getFriendIds = (dispatch) => async (forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    let storedVersion = null;
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(FRIEND_IDS_CACHE_KEY);
      if (cachedData) {
        try {
          const { friendIds, timestamp, version } = JSON.parse(cachedData);
          const now = Date.now();
          storedVersion = version;
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friend IDs data');
            dispatch({ type: "SET_FRIEND_IDS", payload: { friendIds, version } });
            
            // If the cache is stale (but still valid), refresh in background with delta
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friend IDs cache is stale, checking for updates');
              fetchFreshFriendIds(dispatch, version);
            }
            
            return friendIds;
          }
        } catch (err) {
          console.error('Error parsing friend IDs cache:', err);
        }
      }
    }
    
    return await fetchFreshFriendIds(dispatch, storedVersion);
  } catch (error) {
    console.error("Error fetching friend IDs:", error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || "Failed to fetch friend IDs" 
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Helper function to fetch fresh friend IDs with delta support
const fetchFreshFriendIds = async (dispatch, sinceVersion = null) => {
  try {
    // Build query params for delta updates
    const params = new URLSearchParams({ idsOnly: 'true' });
    if (sinceVersion) {
      params.append('sinceVersion', sinceVersion.toString());
    }
    
    const response = await api.get(`/friends?${params}`);
    const data = response.data;
    
    // Handle delta response
    if (data.unchanged) {
      console.log('Friend IDs unchanged since last fetch');
      return null; // No update needed
    }
    
    const friendIds = data.friendIds || [];
    const version = data.version;
    
    // Cache the friend IDs with version
    await AsyncStorage.setItem(FRIEND_IDS_CACHE_KEY, JSON.stringify({
      friendIds,
      version,
      timestamp: Date.now()
    }));
    
    // Dispatch appropriate action based on delta or full update
    if (data.deltaUpdate && sinceVersion) {
      dispatch({ 
        type: "UPDATE_FRIENDS_DELTA", 
        payload: { friendIds, version, deltaUpdate: true } 
      });
    } else {
      dispatch({ type: "SET_FRIEND_IDS", payload: { friendIds, version } });
    }
    
    return friendIds;
  } catch (error) {
    console.error("Error fetching fresh friend IDs:", error);
    throw error;
  }
};

// Get friends list with delta updates support
const getFriends = (dispatch) => async (forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    let storedVersion = null;
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
      if (cachedData) {
        try {
          const { friends, timestamp, version } = JSON.parse(cachedData);
          const now = Date.now();
          storedVersion = version;
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friends data');
            dispatch({ type: "SET_FRIENDS", payload: { friends, version } });
            
            // Also update user cache
            userCache.cacheUsers(friends);
            
            // Check for updates in background if cache is stale
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friends cache is stale, checking for updates');
              fetchFreshFriends(dispatch, version);
            }
            
            return friends;
          }
        } catch (err) {
          console.error('Error parsing friends cache:', err);
        }
      }
    }
    
    return await fetchFreshFriends(dispatch, storedVersion);
  } catch (error) {
    console.error("Error fetching friends:", error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || "Failed to fetch friends" 
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Helper function to fetch fresh friends data with delta support
const fetchFreshFriends = async (dispatch, sinceVersion = null) => {
  try {
    // Build query params for delta updates
    const params = new URLSearchParams();
    if (sinceVersion) {
      params.append('sinceVersion', sinceVersion.toString());
    }
    
    const response = await api.get(`/friends?${params}`);
    const data = response.data;
    
    // Handle delta response
    if (data.unchanged) {
      console.log('Friends unchanged since last fetch');
      return null; // No update needed
    }
    
    const friends = data.friends || [];
    const version = data.version;
    
    // Cache user data from friends (they now come with full data from backend)
    userCache.cacheUsers(friends);
    
    // Cache the friends data with version
    await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify({
      friends,
      version,
      timestamp: Date.now()
    }));
    
    // Dispatch appropriate action based on delta or full update
    if (data.deltaUpdate && sinceVersion) {
      dispatch({ 
        type: "UPDATE_FRIENDS_DELTA", 
        payload: { friends, version, deltaUpdate: true } 
      });
    } else {
      dispatch({ type: "SET_FRIENDS", payload: { friends, version } });
    }
    
    return friends;
  } catch (error) {
    console.error("Error fetching fresh friends:", error);
    throw error;
  }
};

// Get user info by ID - doesn't trigger a load if user not found (for optimized lookups)
const getUserById = (dispatch) => (userId) => {
  return (state) => {
    // Check friends list
    const friend = state.friends.find(f => f.id === userId);
    if (friend) return friend;
    
    // Check friend requests
    const requestUser = state.friendRequests.find(r => r.user?.id === userId);
    if (requestUser?.user) return requestUser.user;
    
    // Check user cache as last resort
    return userCache.getCachedUser(userId);
  };
};

// Get friend requests with delta updates support
const getFriendRequests = (dispatch) => async (forceFetch = false, type = null) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    let storedVersion = null;
    const cacheKey = type ? `${REQUESTS_CACHE_KEY}_${type}` : REQUESTS_CACHE_KEY;
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { requests, timestamp, version } = JSON.parse(cachedData);
          const now = Date.now();
          storedVersion = version;
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friend requests data');
            dispatch({ type: "SET_FRIEND_REQUESTS", payload: { requests, version } });
            
            // Also cache user data
            requests.forEach(request => {
              if (request.user) {
                userCache.cacheUser(request.user);
              }
            });
            
            // If the cache is stale (but still valid), refresh in background
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friend requests cache is stale, checking for updates');
              fetchFreshRequests(dispatch, type, version, cacheKey);
            }
            
            return requests;
          }
        } catch (err) {
          console.error('Error parsing friend requests cache:', err);
        }
      }
    }
    
    return await fetchFreshRequests(dispatch, type, storedVersion, cacheKey);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || "Failed to fetch friend requests" 
    });
    return [];
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Helper function to fetch fresh friend requests with delta support
const fetchFreshRequests = async (dispatch, type = null, sinceVersion = null, cacheKey) => {
  try {
    // Build query params for delta updates and filtering
    const params = new URLSearchParams();
    if (type) {
      params.append('type', type);
    }
    if (sinceVersion) {
      params.append('sinceVersion', sinceVersion.toString());
    }
    
    const response = await api.get(`/friends/requests?${params}`);
    const data = response.data;
    
    // Handle delta response
    if (data.unchanged) {
      console.log('Friend requests unchanged since last fetch');
      return null; // No update needed
    }
    
    const requests = data.requests || [];
    const version = data.version;
    
    // Cache user data from requests (they now come with full user data from backend)
    requests.forEach(request => {
      if (request.user) {
        userCache.cacheUser(request.user); 
      }
    });
    
    // Cache the requests data with version
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      requests,
      version,
      timestamp: Date.now()
    }));
    
    // Dispatch appropriate action based on delta or full update
    if (data.deltaUpdate && sinceVersion) {
      dispatch({ 
        type: "UPDATE_REQUESTS_DELTA", 
        payload: { requests, version, deltaUpdate: true } 
      });
    } else {
      dispatch({ type: "SET_FRIEND_REQUESTS", payload: { requests, version } });
    }
    
    return requests;
  } catch (error) {
    console.error("Error fetching fresh friend requests:", error);
    throw error;
  }
};

// Send a friend request (updated to work with new backend that includes user data)
const sendFriendRequest = (dispatch) => async (receiverId, receiverData = null) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // The backend now handles fetching both sender and receiver data including usernames
    const requestBody = { receiverId };
    
    const response = await api.post("/friends/request", requestBody);
    
    if (response.data.success) {
      // Backend now returns enhanced data with usernames
      const { requestId, senderUsername, receiverUsername } = response.data;
      
      // Create the request object for local state with the username data from backend
      const requestUser = receiverData || userCache.getCachedUser(receiverId) || { 
        id: receiverId, 
        username: receiverUsername || 'Unknown User' // Use backend-provided username
      };
      
      // Add to sent requests in local state with enhanced data
      dispatch({ 
        type: "ADD_SENT_REQUEST", 
        payload: { 
          id: requestId,
          user: requestUser,
          status: 'pending',
          createdAt: new Date().toISOString(),
          senderUsername, // Include sender username from backend
          receiverUsername, // Include receiver username from backend
          type: 'sent' // Explicitly mark as sent request
        } 
      });
      
      // Also cache the user data if we have it
      if (receiverUsername) {
        userCache.cacheUser({
          id: receiverId,
          username: receiverUsername,
          ...receiverData
        });
      }
      
      // Clear cache to force refresh on next fetch
      await AsyncStorage.removeItem(REQUESTS_CACHE_KEY);
    }
    
    return {
      success: response.data.success,
      requestId: response.data.requestId,
      message: response.data.message,
      senderUsername: response.data.senderUsername,
      receiverUsername: response.data.receiverUsername,
      error: null
    };
  } catch (error) {
    console.error("Error sending friend request:", error);
    const errorMsg = error.response?.data?.error || "Failed to send friend request";
    dispatch({ type: "SET_ERROR", payload: errorMsg });
    return {
      success: false,
      error: errorMsg
    };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Respond to a friend request (updated to work with new backend response format)
const respondToFriendRequest = (dispatch) => async (requestId, action) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    const response = await api.post("/friends/respond", { requestId, action });
    
    if (response.data.success) {
      // Remove the request from local state
      dispatch({ type: "REMOVE_FRIEND_REQUEST", payload: requestId });
      
      // If accepting, the backend now returns the new friend data
      if (action === 'accept' && response.data.newFriend) {
        dispatch({ type: "ADD_FRIEND", payload: response.data.newFriend });
        
        // Cache the new friend data
        userCache.cacheUser(response.data.newFriend);
      }
      
      // Clear relevant caches to force refresh
      await AsyncStorage.multiRemove([
        REQUESTS_CACHE_KEY,
        FRIENDS_CACHE_KEY,
        FRIEND_IDS_CACHE_KEY
      ]);
      
      return {
        success: true,
        message: response.data.message,
        newFriend: response.data.newFriend,
        error: null
      };
    } else {
      return {
        success: false,
        error: response.data.error || "Unknown error"
      };
    }
  } catch (error) {
    console.error("Error responding to friend request:", error);
    const errorMsg = error.response?.data?.error || "Failed to respond to friend request";
    dispatch({ type: "SET_ERROR", payload: errorMsg });
    return {
      success: false,
      error: errorMsg
    };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Remove a friend (updated to work with new backend)
const removeFriend = (dispatch) => async (friendId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    const response = await api.delete(`/friends/remove/${friendId}`);
    
    if (response.data.success) {
      dispatch({ type: "REMOVE_FRIEND", payload: friendId });
      
      // Clear relevant caches to force refresh
      await AsyncStorage.multiRemove([
        FRIENDS_CACHE_KEY,
        FRIEND_IDS_CACHE_KEY
      ]);
    }
    
    return {
      success: response.data.success,
      message: response.data.message,
      error: null
    };
  } catch (error) {
    console.error("Error removing friend:", error);
    const errorMsg = error.response?.data?.error || "Failed to remove friend";
    dispatch({ type: "SET_ERROR", payload: errorMsg });
    return {
      success: false,
      error: errorMsg
    };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Clear all friends-related cache data (updated with new cache keys)
const clearFriendsCache = async () => {
  try {
    // Clear all friends-related cache keys including versioned ones
    await AsyncStorage.multiRemove([
      FRIENDS_CACHE_KEY,
      FRIEND_IDS_CACHE_KEY,
      REQUESTS_CACHE_KEY,
      `${REQUESTS_CACHE_KEY}_sent`,
      `${REQUESTS_CACHE_KEY}_received`
    ]);
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing friends cache:', error);
    return false;
  }
};

// Initialize with version tracking
const initialState = {
  friends: [], 
  friendIds: [],
  friendRequests: [], 
  friendsVersion: null,
  friendIdsVersion: null,
  requestsVersion: null,
  loading: false, 
  error: null
};

export const { Provider, Context } = createDataContext(
  friendsReducer,
  { 
    getFriends, 
    getFriendIds,
    getFriendRequests, 
    sendFriendRequest, 
    respondToFriendRequest, 
    removeFriend,
    getUserById,
    clearFriendsCache
  },
  initialState
);