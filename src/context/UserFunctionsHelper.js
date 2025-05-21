import api, { storage } from '../utilities/backendApi';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
            achievements: response.data.achievements || {},
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
                date: response.data.date // Date used for the update
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
                profilePictureUrl: apiResponse.data.profilePictureUrl,
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