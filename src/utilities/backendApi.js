import axios from 'axios';
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

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

// const API_BASE_URL = 'https://scoliobackend-455720.nw.r.appspot.com/api/'; 

const API_BASE_URL = 'https://0285-86-30-169-92.ngrok-free.app/api/'; // gcloud backend not updated 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  try {
    // Try to get token from AsyncStorage first (this is what the rest of the app is using)
    const asyncStorageToken = await AsyncStorage.getItem('idToken');
    
    if (asyncStorageToken) {
      console.log("Using token from AsyncStorage");
      config.headers.Authorization = `Bearer ${asyncStorageToken}`;
      return config;
    }
    
    // Fallback to Firebase auth if AsyncStorage token is not available
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      console.log("Using Firebase Token:", token);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("No authentication token found - user must sign in");
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

export default api; 