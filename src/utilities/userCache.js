import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_KEY = 'app_user_cache';
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes

// Initialize cache from storage
let userCache = {};
let loadPromise = null;

const loadCache = async () => {
  if (loadPromise) return loadPromise;
  
  loadPromise = AsyncStorage.getItem(USER_CACHE_KEY)
    .then(data => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.expiry > Date.now()) {
            userCache = parsed.users || {};
          } else {
            // Reset if expired
            userCache = {};
          }
        } catch (err) {
          console.error('Error parsing user cache:', err);
          userCache = {};
        }
      }
    })
    .catch(err => {
      console.error('Error loading user cache:', err);
    })
    .finally(() => {
      loadPromise = null;
    });
    
  return loadPromise;
};

// Try to load on init
loadCache();

// Save cache to storage
const persistCache = async () => {
  try {
    const data = {
      users: userCache,
      expiry: Date.now() + CACHE_EXPIRY
    };
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving user cache:', err);
  }
};

// Get a user from cache or return null
export const getCachedUser = (userId) => {
  if (!userId) return null;
  
  // Ensure cache is loaded first
  if (Object.keys(userCache).length === 0) {
    // Try to load synchronously from memory if possible
    try {
      // Can't use AsyncStorage synchronously, so just use the in-memory cache
      console.log("Cache not loaded yet, returning null for user:", userId);
      // This triggers async loading for next time
      loadCache();
    } catch (err) {
      // Ignore error, will fall back to empty cache
      console.log("Could not ensure user cache is loaded");
    }
  }
  
  return userCache[userId] || null;
};

// A variable to track the timeout
let persistTimeoutId = null;

// Add/update a user in cache
export const cacheUser = (user) => {
  if (!user || !user.id) {
    console.warn("Attempted to cache invalid user:", user);
    return;
  }
  
  // Ensure we have the minimal required fields
  userCache[user.id] = {
    id: user.id,
    username: user.username || user.displayName || "Unknown",
    avatar: user.avatar || null,
    lastUpdated: Date.now()
  };
  
  // Debounced persist (can skip for high-frequency updates)
  if (persistTimeoutId) clearTimeout(persistTimeoutId);
  persistTimeoutId = setTimeout(persistCache, 1000);
};

// Add multiple users to cache
export const cacheUsers = (users) => {
  if (!Array.isArray(users)) {
    console.warn("cacheUsers called with non-array:", users);
    return;
  }
  
  let changed = false;
  users.forEach(user => {
    if (user && user.id) {
      userCache[user.id] = {
        id: user.id,
        username: user.username || user.displayName || "Unknown",
        avatar: user.avatar || null,
        lastUpdated: Date.now()
      };
      changed = true;
    }
  });
  
  if (changed) {
    if (persistTimeoutId) clearTimeout(persistTimeoutId);
    persistTimeoutId = setTimeout(persistCache, 1000);
  }
};

// Clear cache
export const clearUserCache = async () => {
  userCache = {};
  await AsyncStorage.removeItem(USER_CACHE_KEY);
};

export default {
  getCachedUser,
  cacheUser,
  cacheUsers,
  clearUserCache
}; 