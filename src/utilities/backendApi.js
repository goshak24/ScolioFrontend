import axios from 'axios';
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants"; 
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth"; 

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} = Constants.expoConfig.extra;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig); 
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Track Firebase Auth state
let isFirebaseAuthReady = false;
let currentBackendUserId = null;

// Firebase Auth state listener  
onAuthStateChanged(auth, (user) => {
  isFirebaseAuthReady = true;
  if (user) {
    console.log("🔥 Firebase Auth ready");
  }
});

// Function to verify backend token and setup Firebase Auth
export const verifyBackendTokenAndSetupFirebase = async () => {
  try {
    // Get current token from AsyncStorage
    const idToken = await AsyncStorage.getItem("idToken");
    if (!idToken) {
      return { success: false, error: "No backend token" };
    }
    
    // Verify backend token to get the backend user id
    let backendUserId = null;
    try {
      const verifyResp = await api.get("/auth/verify-token", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      backendUserId = verifyResp?.data?.userId || null;
    } catch (e) {
      console.error('❌ Auth verification failed:', e?.message || e);
      return { success: false, error: 'verify_failed' };
    }

    // If already signed in with matching UID, skip re-signin
    if (auth.currentUser && backendUserId && auth.currentUser.uid === backendUserId) {
      return { success: true, user: auth.currentUser, backendUserId };
    }

    // Request a Firebase custom token for this backend user
    // Try a couple of likely endpoints; backend must mint via Admin SDK
    let customToken = null; 
    const ctResp = await api.get("/auth/firebase-custom-token", { headers: { Authorization: `Bearer ${idToken}` } });
    if (ctResp?.data?.customToken) {
      customToken = ctResp.data.customToken;
    }
  
    if (!customToken) {
      return { success: false, error: 'no_custom_token_endpoint' };
    }

    // Sign out if changing users
    if (auth.currentUser && backendUserId && auth.currentUser.uid !== backendUserId) {
      await signOut(auth);
    }

    // Sign in with custom token so request.auth.uid == backend user id
    const cred = await signInWithCustomToken(auth, customToken);
    currentBackendUserId = cred.user?.uid || backendUserId;

    console.log("✅ Firebase Auth ready for Firestore (custom token)");
    return { success: true, user: cred.user, backendUserId: currentBackendUserId };
    
  } catch (error) {
    console.error("❌ Firebase Auth setup failed:", error.message);
    return { success: false, error: error.message };
  }
};

// Function to clear Firebase Auth when backend user logs out
export const clearFirebaseAuth = async () => {
  try {
    if (auth.currentUser) {
      await signOut(auth);
      currentBackendUserId = null;
    }
  } catch (error) {
    console.error("❌ Error clearing Firebase Auth:", error);
  }
};

// Simple function to check if Firebase Auth exists (for Firestore access)
export const hasFirebaseAuth = () => {
  return auth?.currentUser !== null;
};

const storage = getStorage(app);

const API_BASE_URL = 'https://scoliobackend.ew.r.appspot.com/api/'; // Remeber to push back notification controller days to not alert people of old notifications 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Keep track of if we're currently refreshing the token to avoid multiple refreshes
let isRefreshingToken = false;
let refreshPromise = null;

// Queue of requests waiting for token refresh
let refreshSubscribers = [];

// Function to add requests to the queue
const subscribeToTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Function to notify all waiting requests that token is refreshed
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

// Function to refresh the token
const refreshAuthToken = async () => {
  if (isRefreshingToken) {
    return refreshPromise;
  }

  isRefreshingToken = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}auth/refresh-token`, { refreshToken });
      
      if (response.data && response.data.idToken) {
        // Store the new tokens
        await AsyncStorage.setItem('idToken', response.data.idToken);
        
        // If a new refresh token was provided, update it
        if (response.data.refreshToken) {
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Set token expiry time (current time + 30 minutes)
        const expiryTime = Date.now() + 30 * 60 * 1000;
        await AsyncStorage.setItem('tokenExpiryTime', expiryTime.toString());
        
        // Notify waiting requests
        onTokenRefreshed(response.data.idToken);
        return response.data.idToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      onTokenRefreshed(null);
      throw error;
    } finally {
      isRefreshingToken = false;
    }
  })();

  return refreshPromise;
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  try {
    // Try to get token from AsyncStorage first
    const asyncStorageToken = await AsyncStorage.getItem('idToken');
    
    if (asyncStorageToken) {
      config.headers.Authorization = `Bearer ${asyncStorageToken}`;
      
      // Check if token is about to expire
      const expiryTimeStr = await AsyncStorage.getItem('tokenExpiryTime');
      if (expiryTimeStr) {
        const expiryTime = parseInt(expiryTimeStr, 10);
        const currentTime = Date.now();
        
        // If token expires in less than 5 minutes, refresh it in the background
        // but still use the current token for this request
        if (currentTime + 5 * 60 * 1000 >= expiryTime && !isRefreshingToken) {
          // Don't await this - let it happen in the background
          refreshAuthToken().catch(err => console.log('Background token refresh failed:', err));
        }
      }
      
      return config;
    }
    
    // Fallback to Firebase auth if AsyncStorage token is not available
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  } catch (error) {
    console.error("Error in auth interceptor:", error);
    return config;
  }
});

export const configureServerCaching = async () => {
  try {
    // Request the server to use longer cache TTLs
    console.log("Configuring longer server-side cache TTLs");
    const response = await api.post("/messages/configure-cache", {
      userCacheTtl: 60, // 60 minutes for user cache
      conversationCacheTtl: 30, // 30 minutes for conversations
      messagesCacheTtl: 15 // 15 minutes for messages 
    }, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log("Server caching configuration updated");
    return true;
  } catch (error) {
    // Handle different error types
    if (error.code === 'ECONNABORTED') {
      console.log("Cache configuration request timed out");
    } else if (error.response) {
      // The server responded with an error status code
      console.log(`Server returned ${error.response.status} when configuring cache`);
    } else if (error.request) {
      // The request was made but no response was received
      console.log("No response received when configuring cache");
    } else {
      // Something else went wrong
      console.log("Error configuring cache:", error.message);
    }
    
    // The app will still work with default cache settings
    console.log("Using default cache settings");
    return false;
  }
};

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Mark this request as retried
      originalRequest._retry = true;
      
      try {
        // If we're already refreshing, wait for that to complete
        let token;
        if (isRefreshingToken) {
          return new Promise((resolve, reject) => {
            subscribeToTokenRefresh((newToken) => {
              if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(api(originalRequest));
              } else {
                reject(error);
              }
            });
          });
        } else {
          // Otherwise, refresh the token ourselves
          token = await refreshAuthToken();
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        console.error('Token refresh failed during response interceptor:', refreshError);
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export { auth, storage, refreshAuthToken };
export default api; 