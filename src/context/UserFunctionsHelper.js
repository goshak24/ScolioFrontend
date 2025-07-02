import { ref, getDownloadURL } from "firebase/storage";
import api, { auth, storage } from '../utilities/backendApi';
import Constants from 'expo-constants';

const {
    FIREBASE_STORAGE_BUCKET,
  } = Constants.expoConfig.extra;

export const extendStreak = async (idToken) => {
    try {
        const response = await api.patch(
            '/users/extend-streak',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        const lastStreakUpdate = response.data.lastStreakUpdate || new Date().toISOString().split('T')[0];
        
        return {
            success: true,
            newStreak: response.data.newStreak,
            lastStreakUpdate,
            alreadyUpdatedToday: response.data.message === "Streak already updated today"
        };
    } catch (error) {
        console.error('Extend streak error:', error.response?.data || error.message);
        if (error.response?.data?.message === "Streak already updated today") {
            return {
                success: true,
                newStreak: error.response?.data?.newStreak || 0,
                lastStreakUpdate: error.response?.data?.lastStreakUpdate || new Date().toISOString().split('T')[0],
                alreadyUpdatedToday: true
            };
        }
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to extend streak'
        };
    }
};

export const updateUserProfile = async (idToken, updates) => {
    try {
        const response = await api.patch(
            '/users/update-profile',
            updates,
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        return {
            success: true,
            updatedUser: response.data.user
        };
    } catch (error) {
        console.error('Update profile error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.message || 'Failed to update profile'
        };
    }
}; 

export const logPhysioSession = async (idToken, date = null) => {
    try {
        // Create request body with optional date parameter
        const requestBody = date ? { date } : {};
        
        const response = await api.post(
            '/users/log-physio',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );

        return {
            success: true,
            newPhysioCount: response.data.newPhysioCount,
            achievements: response.data.badges || {},
            newAchievements: response.data.newBadges || {},
            date: response.data.date, // The date used for the log (could be provided or today's date)
            totalSessionsForDate: response.data.totalSessionsForDate || 1 // Number of sessions for this specific date
        };
    } catch (error) {
        console.error('Physio log error:', error.response?.data || error.message);
        
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to log physio session'
        };
    }
};

export const updateWornHours = async (idToken, hours, date = null) => {
    try {
        const response = await api.put(
            "/users/update-bracehours", 
            { hours, date },
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        if (response.data.success) {
            return {
                success: true,
                totalHours: response.data.totalHours,
                date: response.data.date, // Date used for the update
                newAchievements: response.data.newBadges || {},
            };
        } else {
            return { 
                success: false, 
                error: response.data.error || "Failed to update brace hours" 
            };
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to update brace hours";
        console.error('Update brace hours error:', errorMessage);
        
        // If we get a 404 error (treatment data not found), try to initialize treatment data first
        if (error.response?.status === 404 && errorMessage.includes('Treatment data not found')) {
            console.log('Treatment data not found, attempting to initialize...');
            try {
                const initResult = await initializeTreatmentData(idToken);
                if (initResult.success) {
                    console.log('Treatment data initialized, retrying brace hours update...');
                    // Retry the original request
                    const retryResponse = await api.put(
                        "/users/update-bracehours", 
                        { hours, date },
                        {
                            headers: {
                                'Authorization': `Bearer ${idToken}`
                            }
                        }
                    );
                    
                    if (retryResponse.data.success) {
                        return {
                            success: true,
                            totalHours: retryResponse.data.totalHours,
                            date: retryResponse.data.date,
                            newAchievements: retryResponse.data.newBadges || {},
                        };
                    }
                }
            } catch (initError) {
                console.error('Failed to initialize treatment data:', initError);
            }
        }
        
        return { success: false, error: errorMessage };
    }
}; 

export const incrementWalkingMinutes = async (idToken, increment) => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        const response = await api.put(
            "/users/post-surgery/walking/increment",
            { 
                increment,
                date: today // Add today's date to the request
            },
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        return {
            success: true,
            minutes: response.data.minutes,
            increment: response.data.increment,
            date: today
        };
    } catch (error) {
        console.error('Walking minutes increment error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to increment walking minutes'
        };
    }
};

export const updateWalkingMinutes = async (idToken, minutes) => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        const response = await api.put(
            "/users/post-surgery/walking",
            { 
                minutes,
                date: today // Add today's date to the request 
            },
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        return {
            success: true,
            minutes: response.data.minutes || minutes,
            date: today
        };
    } catch (error) {
        console.error('Walking minutes update error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to update walking minutes'
        };
    }
};

/**
 * Get a download URL for a file path using Firebase Storage
 * This respects Firebase Security Rules and requires proper authentication
 * 
 * @param {string} filePath - The path to the file in Firebase Storage (e.g., 'profile_pictures/user123.jpg')
 * @param {string} [idToken] - Optional ID token for authentication with backend fallback
 * @returns {Promise<string>} A download URL for the file
 */
export const getFileDownloadUrl = async (filePath, providedIdToken) => {
  try {
    if (!filePath) {
      throw new Error("File path is required");
    }
    
    // Get the ID token - either from provided param or from AsyncStorage
    let idToken = providedIdToken;
    if (!idToken) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        idToken = await AsyncStorage.getItem('idToken');
      } catch (error) {
        console.error("Error getting token from AsyncStorage:", error);
      }
    }
    
    if (!idToken) {
      throw new Error("Authentication token is required to access this file");
    }
    
    // Instead of using the Firebase SDK, construct the URL directly and make an authenticated request
    // The format is: https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/FILE_PATH
    
    // Get bucket name from environment config
    const bucket = FIREBASE_STORAGE_BUCKET;
    
    // Encode the file path
    const encodedFilePath = encodeURIComponent(filePath);
    
    // Construct the direct URL
    const directUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedFilePath}`;
    
    // Make an authenticated request with the ID token in the header
    const response = await fetch(directUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Firebase ${idToken}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    // The response includes metadata including downloadTokens
    const data = await response.json();
    
    // Construct the final download URL with the token
    const downloadUrl = `${directUrl}?alt=media&token=${data.downloadTokens}`;
    console.log("Successfully created direct download URL");
    
    return downloadUrl;
  } catch (error) {
    // For profile pictures, we'll handle this silently without logging the error
    const isProfilePicture = filePath.includes('profile_pictures/');
    
    if (!isProfilePicture) {
      console.error("Error getting download URL:", error);
    }
    
    // If the file doesn't exist or access is denied, try to get a temporary URL from the backend
    if (error.code === 'storage/object-not-found' || error.code === 'storage/unauthorized') {
      try {
        return await getTemporaryUrlFromBackend(filePath, idToken);
      } catch (backendError) {
        // If the backend also fails, we'll handle profile picture errors silently
        if (!isProfilePicture) {
          console.error("Error getting temporary URL:", backendError);
        }
        return null;
      }
    }
    
    // For non-profile pictures, we'll still throw the error
    if (!isProfilePicture) {
      throw error;
    }
    
    return null;
  }
};

/**
 * Fallback method to get a temporary URL from the backend
 * This is useful when the frontend can't access the file directly due to security rules
 * 
 * @param {string} filePath - The path to the file in Firebase Storage
 * @param {string} [providedToken] - Optional ID token for authentication
 * @returns {Promise<string>} A temporary signed URL for the file
 */
const getTemporaryUrlFromBackend = async (filePath, providedToken) => {
  try {
    let idToken = providedToken;
    
    // If no token was provided, try to get it from AsyncStorage
    if (!idToken) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      idToken = await AsyncStorage.getItem('idToken');
    }
    
    if (!idToken) {
      throw new Error("User not authenticated - No token found");
    }
    
    // Use the api client instead of fetch for consistency
    const response = await api.post(
      '/storage/get-temporary-url',
      { filePath },
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Return the temporary URL from the response
    return response.data.temporaryUrl;
  } catch (error) {
    console.error("Error getting temporary URL from backend:", error);
    throw error;
  }
};

/**
 * Get a profile picture URL from a user object
 * This handles both legacy URLs and new file paths
 * 
 * @param {Object} user - The user object from Firestore
 * @param {string} [idToken] - Optional ID token for authentication
 * @returns {Promise<string>} The profile picture URL
 */
export const getProfilePictureUrl = async (user, idToken) => {
  if (!user) return null;
  
  // If the user has a direct profilePicture URL (legacy), use it
  if (user.profilePicture && user.profilePicture.startsWith('http')) {
    return user.profilePicture;
  }
  
  // If the user has a profilePicturePath, get the download URL
  if (user.profilePicturePath) {
    try {
      return await getFileDownloadUrl(user.profilePicturePath, idToken);
    } catch (error) {
      console.error("Error getting profile picture URL:", error);
      return null;
    }
  }
  
  // Return null if no profile picture is available
  return null;
};

export const uploadProfilePicture = async (idToken, imageUri) => {
    try {
        console.log('Starting profile picture upload process...');
        
        try {
            // Read the file as base64
            const base64Image = await readImageAsBase64(imageUri);
            console.log('Base64 image length:', base64Image.length);
            
            if (!base64Image) {
                throw new Error('Failed to convert image to base64');
            }
            
            // Send the base64 image to the backend for processing
            console.log('Sending image to backend...');
            const apiResponse = await api.post(
                '/users/upload-profile-picture',
                { 
                    image: base64Image,
                    contentType: 'image/jpeg',
                    filename: `profile_${Date.now()}.jpg`
                },
                {
                    headers: {
                        'Authorization': `Bearer ${idToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Profile update successful');
            return {
                success: true,
                // Store both the temporary URL and the path
                profilePictureUrl: apiResponse.data.profilePictureUrl, // Temporary URL for immediate use
                profilePicturePath: apiResponse.data.profilePicturePath, // Path for future use with getDownloadURL
                updatedUser: apiResponse.data.user
            };
        } catch (uploadError) {
            console.error('Error during image processing/upload:', uploadError);
            throw new Error(`Image upload failed: ${uploadError.message}`);
        }
    } catch (error) {
        console.error('Upload profile picture error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload profile picture'
        };
    }
};

// Helper function to read an image file as base64
const readImageAsBase64 = async (uri) => {
    try {
        // For Expo/React Native
        const response = await fetch(uri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Get the base64 string (remove the prefix)
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error reading image as base64:', error);
        throw error;
    }
};

// Helper function to extract user ID from token
const getUserIdFromToken = async (token) => {
    try {
        // Get user info from token
        const response = await api.get('/auth/user', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data._id || 'user';
    } catch (error) {
        console.error('Error getting user ID:', error);
        return 'user_' + new Date().getTime(); // Fallback ID if we can't get the real one
    }
};

export const addPhysioWorkout = async (idToken, workout, date = null, dayOfWeek = null) => {
    try {
        // Get dayOfWeek if not provided
        if (!dayOfWeek && date) {
            const dateObj = new Date(date);
            // Get full day name (Monday, Tuesday, etc.)
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            dayOfWeek = days[dateObj.getDay()];
        } else if (!dayOfWeek) {
            // Default to current day
            const today = new Date();
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            dayOfWeek = days[today.getDay()];
        }
        
        // Ensure workout has name property (backend requires it)
        const formattedWorkout = {
            ...workout,
            name: workout.name || workout.title, // Use name or fallback to title
            time: workout.time || '09:00'
        };
        
        // Format the request body according to the backend expectations
        const reqBody = {
            workout: formattedWorkout,
            date: date || new Date().toISOString().split('T')[0],
            dayOfWeek
        };
        
        const response = await api.post(
            '/users/add-physio-workout',
            reqBody,
            {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            }
        );
        
        return {
            success: true,
            date: response.data.date || date,
            workout: response.data.workout || formattedWorkout,
            dayOfWeek: response.data.dayOfWeek || dayOfWeek,
            scheduledWorkouts: response.data.scheduledWorkouts
        };
    } catch (error) {
        console.error('Add physio workout error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data?.error || 'Failed to add physio workout'
        };
    }
};