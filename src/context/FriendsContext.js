import createDataContext from "./createDataContext";
import api from "../utilities/backendApi";
import userCache from "../utilities/userCache";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const FRIENDS_CACHE_KEY = 'friends_data';
const FRIEND_IDS_CACHE_KEY = 'friend_ids_data';  // New cache key for just the IDs
const REQUESTS_CACHE_KEY = 'friend_requests_data';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_REFRESH_THRESHOLD = 20 * 60 * 60 * 1000; // 20 hours (stale-while-revalidate)

const friendsReducer = (state, action) => {
  switch (action.type) {
    case "SET_FRIENDS":
      return { 
        ...state, 
        friends: action.payload, 
        loading: false,
        error: null 
      };
    case "SET_FRIEND_IDS":
      return {
        ...state,
        friendIds: action.payload,
        loading: false,
        error: null
      }; 
    case "SET_FRIEND_REQUESTS":
      return { 
        ...state, 
        friendRequests: action.payload, 
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
            type: "sent"
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

// Get only friend IDs (for optimized fetching)
const getFriendIds = (dispatch) => async (forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(FRIEND_IDS_CACHE_KEY);
      if (cachedData) {
        try {
          const { friendIds, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friend IDs data');
            dispatch({ type: "SET_FRIEND_IDS", payload: friendIds });
            
            // If the cache is stale (but still valid), refresh in background
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friend IDs cache is stale, refreshing in background');
              // We'll continue to fetch fresh data but won't wait for it
              fetchFreshFriendIds(dispatch);
            }
            
            return friendIds;
          }
        } catch (err) {
          console.error('Error parsing friend IDs cache:', err);
        }
      }
    }
    
    return await fetchFreshFriendIds(dispatch);
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

// Helper function to fetch fresh friend IDs
const fetchFreshFriendIds = async (dispatch) => {
  try {
    // Add a custom parameter to tell the backend we only want IDs
    const response = await api.get("/friends?idsOnly=true");
    const friendIds = response.data.friendIds || [];
    
    // Cache the friend IDs
    await AsyncStorage.setItem(FRIEND_IDS_CACHE_KEY, JSON.stringify({
      friendIds,
      timestamp: Date.now()
    }));
    
    dispatch({ type: "SET_FRIEND_IDS", payload: friendIds });
    return friendIds;
  } catch (error) {
    console.error("Error fetching fresh friend IDs:", error);
    throw error;
  }
};

// Get friends list - optimized to use IDs first and lazy load full user data
const getFriends = (dispatch) => async (forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(FRIENDS_CACHE_KEY);
      if (cachedData) {
        try {
          const { friends, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friends data');
            dispatch({ type: "SET_FRIENDS", payload: friends });
            
            // Also update user cache
            userCache.cacheUsers(friends);
            
            // Only refresh in background if cache is very close to expiry
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friends cache nearing expiry, refreshing in background');
              getFriendIds(dispatch)(true);
            }
            
            return friends;
          }
        } catch (err) {
          console.error('Error parsing friends cache:', err);
        }
      }
    }
    
    // First get just the friend IDs (optimized read)
    const friendIds = await getFriendIds(dispatch)(forceFetch);
    
    if (!friendIds || friendIds.length === 0) {
      // No friends, return empty array
      dispatch({ type: "SET_FRIENDS", payload: [] });
      return [];
    }
    
    // Then construct minimal friend objects with data from cache where possible
    const friends = friendIds.map(id => {
      const cachedUser = userCache.getCachedUser(id);
      return cachedUser || { id, username: "Loading...", avatar: null };
    });
    
    // Update state with what we have so far
    dispatch({ type: "SET_FRIENDS", payload: friends });
    
    // Cache the friends data with what we have
    await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify({
      friends,
      timestamp: Date.now()
    }));
    
    return friends;
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

// Get user info by ID - doesn't trigger a load if user not found (for optimized lookups)
const getUserById = (dispatch) => (userId) => {
  // First check local state
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

// Get friend requests
const getFriendRequests = (dispatch) => async (forceFetch = false) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Try to use cached data first if not forcing refresh
    if (!forceFetch) {
      const cachedData = await AsyncStorage.getItem(REQUESTS_CACHE_KEY);
      if (cachedData) {
        try {
          const { requests, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          
          // Use cache if it's less than expiry time
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friend requests data');
            dispatch({ type: "SET_FRIEND_REQUESTS", payload: requests });
            
            // Also cache user data
            requests.forEach(request => {
              if (request.user) {
                userCache.cacheUser(request.user);
              }
            });
            
            // If the cache is stale (but still valid), refresh in background
            if (now - timestamp > CACHE_REFRESH_THRESHOLD) {
              console.log('Friend requests cache is stale, refreshing in background');
              // We'll continue with the stale data but fetch fresh data in background
              fetchFreshRequests(dispatch);
            }
            
            return requests;
          }
        } catch (err) {
          console.error('Error parsing friend requests cache:', err);
        }
      }
    }
    
    return await fetchFreshRequests(dispatch);
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

// Helper function to fetch fresh friend requests
const fetchFreshRequests = async (dispatch) => {
  const response = await api.get("/friends/requests");
  const requests = response.data.requests || [];
  
  // Cache user data from requests
  requests.forEach(request => {
    if (request.user) {
      userCache.cacheUser(request.user);
    }
  });
  
  // Cache the requests data
  await AsyncStorage.setItem(REQUESTS_CACHE_KEY, JSON.stringify({
    requests,
    timestamp: Date.now()
  }));
  
  dispatch({ type: "SET_FRIEND_REQUESTS", payload: requests });
  return requests;
};

// Send a friend request
const sendFriendRequest = (dispatch) => async (receiverId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    const response = await api.post("/friends/request", { receiverId });
    
    if (response.data.success) {
      // Add to sent requests
      dispatch({ 
        type: "ADD_SENT_REQUEST", 
        payload: { 
          id: response.data.requestId,
          user: userCache.getCachedUser(receiverId) || { id: receiverId }
        } 
      });
    }
    
    return {
      success: response.data.success,
      requestId: response.data.requestId,
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

// Respond to a friend request
const respondToFriendRequest = (dispatch) => async (requestId, action) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    const response = await api.post("/friends/respond", { requestId, action });
    
    if (response.data.success) {
      // First find the request to get the user
      dispatch({ type: "SET_LOADING", payload: false });
      return (state) => {
        const request = state.friendRequests.find(r => r.id === requestId);
        
        if (request && action === 'accept') {
          // If accepting, add to friends
          if (request.user) {
            dispatch({ type: "ADD_FRIEND", payload: request.user });
          }
        }
        
        // Remove the request
        dispatch({ type: "REMOVE_FRIEND_REQUEST", payload: requestId });
        
        return {
          success: true,
          error: null
        };
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

// Remove a friend
const removeFriend = (dispatch) => async (friendId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    const response = await api.delete(`/friends/remove/${friendId}`);
    
    if (response.data.success) {
      dispatch({ type: "REMOVE_FRIEND", payload: friendId });
    }
    
    return {
      success: response.data.success,
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

// Clear all friends-related cache data
const clearFriendsCache = async () => {
  try {
    // Clear all friends-related cache keys
    await AsyncStorage.multiRemove([
      FRIENDS_CACHE_KEY,
      FRIEND_IDS_CACHE_KEY,
      REQUESTS_CACHE_KEY
    ]);
    
    console.log('🧹 Friends cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing friends cache:', error);
    return false;
  }
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
  { 
    friends: [], 
    friendIds: [],
    friendRequests: [], 
    loading: false, 
    error: null
  }
); 