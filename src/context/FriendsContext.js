import createDataContext from "./createDataContext";
import api from "../utilities/backendApi";
import userCache from "../utilities/userCache";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const FRIENDS_CACHE_KEY = 'friends_data';
const REQUESTS_CACHE_KEY = 'friend_requests_data';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const friendsReducer = (state, action) => {
  switch (action.type) {
    case "SET_FRIENDS":
      return { 
        ...state, 
        friends: action.payload, 
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
        loading: false,
        error: null
      };
    case "REMOVE_FRIEND":
      return {
        ...state,
        friends: state.friends.filter(friend => friend.id !== action.payload),
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

// Get friends list
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
          
          // Use cache if it's less than 5 minutes old
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friends data');
            dispatch({ type: "SET_FRIENDS", payload: friends });
            
            // Also update user cache
            userCache.cacheUsers(friends);
            
            return friends;
          }
        } catch (err) {
          console.error('Error parsing friends cache:', err);
        }
      }
    }
    
    const response = await api.get("/friends");
    const friends = response.data.friends || [];
    
    // Cache the friends data in user cache
    userCache.cacheUsers(friends);
    
    // Also cache the friends list itself
    await AsyncStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify({
      friends,
      timestamp: Date.now()
    }));
    
    dispatch({ type: "SET_FRIENDS", payload: friends });
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
          
          // Use cache if it's less than 5 minutes old
          if (now - timestamp < CACHE_EXPIRY) {
            console.log('Using cached friend requests data');
            dispatch({ type: "SET_FRIEND_REQUESTS", payload: requests });
            
            // Also cache user data
            requests.forEach(request => {
              if (request.user) {
                userCache.cacheUser(request.user);
              }
            });
            
            return requests;
          }
        } catch (err) {
          console.error('Error parsing friend requests cache:', err);
        }
      }
    }
    
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

// Send friend request
const sendFriendRequest = (dispatch) => async (receiverId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    const response = await api.post("/friends/request", { receiverId });
    
    // We should get the full user object but for now let's just use the ID
    dispatch({ 
      type: "ADD_SENT_REQUEST", 
      payload: {
        id: response.data.requestId,
        status: "pending",
        user: {
          id: receiverId
        }
      }
    });

    // Invalidate the requests cache
    await AsyncStorage.removeItem(REQUESTS_CACHE_KEY);
    
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error sending friend request:", error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || "Failed to send friend request" 
    });
    return { success: false, error: error.response?.data?.message || "Failed to send friend request" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Respond to friend request (accept/reject)
const respondToFriendRequest = (dispatch) => async (requestId, action) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    const response = await api.post("/friends/respond", { requestId, action });
    
    // Remove the request from our list
    dispatch({ type: "REMOVE_FRIEND_REQUEST", payload: requestId });
    
    // If accepted, we might want to add the user to friends list
    // For now, let's just call getFriends again to refresh the list
    if (action === "accept") {
      await getFriends(dispatch)(true); // Force refresh
    }
    
    // Invalidate caches
    await AsyncStorage.removeItem(REQUESTS_CACHE_KEY);
    if (action === "accept") {
      await AsyncStorage.removeItem(FRIENDS_CACHE_KEY);
    }
    
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error(`Error ${action}ing friend request:`, error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || `Failed to ${action} friend request` 
    });
    return { success: false, error: error.response?.data?.message || `Failed to ${action} friend request` };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

// Remove a friend
const removeFriend = (dispatch) => async (friendId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    const response = await api.delete(`/friends/remove/${friendId}`);
    
    dispatch({ type: "REMOVE_FRIEND", payload: friendId });
    
    // Invalidate the friends cache
    await AsyncStorage.removeItem(FRIENDS_CACHE_KEY);
    
    return { success: true, message: response.data.message };
  } catch (error) {
    console.error("Error removing friend:", error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.response?.data?.message || "Failed to remove friend" 
    });
    return { success: false, error: error.response?.data?.message || "Failed to remove friend" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

export const { Provider, Context } = createDataContext(
  friendsReducer,
  { 
    getFriends, 
    getFriendRequests, 
    sendFriendRequest, 
    respondToFriendRequest, 
    removeFriend,
    getUserById
  },
  { 
    friends: [], 
    friendRequests: [], 
    loading: false, 
    error: null
  }
); 