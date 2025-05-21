import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './backendApi';
import { Platform } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Constants
const TOKEN_REFRESH_TASK = 'TOKEN_REFRESH_TASK';
const TOKEN_REFRESH_INTERVAL = 29 * 60 * 1000; // 29 minutes in milliseconds
const TOKEN_EXPIRY_KEY = 'tokenExpiryTime';

// Define the background task
TaskManager.defineTask(TOKEN_REFRESH_TASK, async () => {
  try {
    const needsRefresh = await shouldRefreshToken();
    if (needsRefresh) {
      await refreshToken();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('Background token refresh failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Check if token needs refreshing
export const shouldRefreshToken = async () => {
  try {
    const expiryTimeStr = await AsyncStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTimeStr) return true;
    
    const expiryTime = parseInt(expiryTimeStr, 10);
    const currentTime = Date.now();
    
    // If token expires in less than 5 minutes, refresh it
    return currentTime + 5 * 60 * 1000 >= expiryTime;
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return true; // Refresh to be safe
  }
};

// Refresh token and update storage
export const refreshToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    if (response.data && response.data.idToken) {
      // Store the new tokens
      await AsyncStorage.setItem('idToken', response.data.idToken);
      
      // If a new refresh token was provided, update it
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Set token expiry time (current time + 30 minutes)
      const expiryTime = Date.now() + 30 * 60 * 1000;
      await AsyncStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      console.log('Token refreshed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Initialize the token refresh mechanism
export const initializeTokenRefresh = async () => {
  try {
    // Register the background fetch task
    await BackgroundFetch.registerTaskAsync(TOKEN_REFRESH_TASK, {
      minimumInterval: TOKEN_REFRESH_INTERVAL,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    
    // Also set up a foreground interval for when the app is active
    setForegroundRefreshInterval();
    
    console.log('Token refresh mechanism initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize token refresh:', error);
    return false;
  }
};

// Set up a foreground interval to refresh token
let foregroundRefreshInterval = null;

export const setForegroundRefreshInterval = () => {
  // Clear any existing interval
  if (foregroundRefreshInterval) {
    clearInterval(foregroundRefreshInterval);
  }
  
  // Set a new interval
  foregroundRefreshInterval = setInterval(async () => {
    const needsRefresh = await shouldRefreshToken();
    if (needsRefresh) {
      await refreshToken();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Clean up when app is closed or user logs out
export const cleanupTokenRefresh = async () => {
  try {
    // Unregister the background task
    await BackgroundFetch.unregisterTaskAsync(TOKEN_REFRESH_TASK);
    
    // Clear the foreground interval
    if (foregroundRefreshInterval) {
      clearInterval(foregroundRefreshInterval);
      foregroundRefreshInterval = null;
    }
    
    console.log('Token refresh mechanism cleaned up');
    return true;
  } catch (error) {
    console.error('Failed to cleanup token refresh:', error);
    return false;
  }
};

// Function to manually trigger a token refresh
export const manualRefreshToken = async () => {
  try {
    const result = await refreshToken();
    return result;
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    return false;
  }
};

// Export a default object with all functions
export default {
  initializeTokenRefresh,
  refreshToken,
  shouldRefreshToken,
  cleanupTokenRefresh,
  manualRefreshToken,
  setForegroundRefreshInterval
};
