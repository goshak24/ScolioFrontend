import createDataContext from "./createDataContext";
import api, { auth } from "../utilities/backendApi";
import { updateUserProfile, addPhysioWorkout, uploadProfilePicture, getProfilePictureUrl } from "./UserFunctionsHelper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Context as MessagesContext } from './MessagesContext';
import { useContext } from 'react';
import { Context as FriendsContext } from './FriendsContext';

const userReducer = (state, action) => {
    switch (action.type) {
        case "SET_USER_DATA":
            return { 
                ...state, 
                user: action.payload,
                loading: false,
                error: null
            };
        case "UPDATE_USER":
            return { 
                ...state, 
                user: { ...state.user, ...action.payload },
                loading: false,
                error: null
            };
        case "UPDATE_PROFILE_PICTURE":
            return {
                ...state,
                user: {
                    ...state.user,
                    profilePicture: action.payload.profilePictureUrl,
                    profilePicturePath: action.payload.profilePicturePath
                },
                loading: false,
                error: null
            };
        case "UPDATE_BRACE_HOURS":
            return {
                ...state,
                user: {
                    ...state.user,
                    treatmentData: {
                        ...state.user.treatmentData,
                        brace: {
                            ...state.user.treatmentData.brace,
                            wornTodayHours: action.payload.hours,
                            wearingHistory: [
                                ...(state.user.treatmentData.brace.wearingHistory || []),
                                {
                                    date: new Date().toISOString(),
                                    hours: action.payload.hours
                                }
                            ]
                        }
                    }
                }
            };
        case "SET_CALENDAR_EVENTS":
            return {
                ...state,
                user: {
                    ...state.user,
                    events: {
                        ...(state.user?.events || {}),
                        ...action.payload
                    }
                }
            };
        case "ADD_CALENDAR_EVENT":
            return {
                ...state,
                user: {
                    ...state.user,
                    events: {
                        ...(state.user?.events || {}),
                        [action.payload.date]: [
                            ...(state.user?.events?.[action.payload.date] || []),
                            action.payload
                        ]
                    }
                }
            };
        case "INCREMENT_STREAK":
            return {
                ...state,
                user: {
                    ...state.user, 
                    streaks: (state.user?.streaks || 0) + 1,
                    lastStreakUpdate: action.payload.today
                }
            };
        case "INCREMENT_PHYSIO":
            return {
                ...state,
                user: {
                    ...state.user,
                    physioSessions: (state.user?.physioSessions || 0) + 1
                }
            };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload, loading: false };
        case "RESET":
            return { user: null, loading: false, error: null };
        case "SET_STREAK":
            return {
                ...state,
                user: {
                    ...state.user, 
                    streaks: action.payload.newStreak,
                    lastStreakUpdate: action.payload.lastStreakUpdate
                }
            };
        case "RESET_DAILY_BRACE_HOURS":
            if (!state.user?.treatmentData?.brace) {
                return state;
            }
            
            const today = action.payload.today;
            const updatedWearingHistory = { 
                ...(state.user.treatmentData.brace.wearingHistory || {})
            };
            
            if (updatedWearingHistory[today] === undefined) {
                updatedWearingHistory[today] = 0;
            }
            
            return {
                ...state,
                user: {
                    ...state.user,
                    treatmentData: {
                        ...state.user.treatmentData,
                        brace: {
                            ...state.user.treatmentData.brace,
                            wearingHistory: updatedWearingHistory
                        }
                    }
                }
            };
        case "ADD_PHYSIO_WORKOUT":
            const { date, workout, dayOfWeek, scheduledWorkouts } = action.payload;
            return {
                ...state,
                user: {
                    ...state.user,
                    treatmentData: {
                        ...state.user.treatmentData,
                        physio: {
                            ...state.user.treatmentData?.physio,
                            workouts: {
                                ...(state.user.treatmentData?.physio?.workouts || {}),
                                [date]: workout
                            },
                            scheduledWorkouts: scheduledWorkouts || 
                                (state.user.treatmentData?.physio?.scheduledWorkouts || {})
                        }
                    },
                    physioSessions: (state.user?.physioSessions || 0) + 1
                }
            };
        case "SIGN_OUT":
            return { user: null, loading: false, error: null };
        default:
            return state;
    }
};

const resetUser = (dispatch) => async () => {
    try {
        // Clear user state from AsyncStorage
        await AsyncStorage.removeItem('userState');
        
        // Dispatch reset action
        dispatch({ type: "RESET" });
        return true;
    } catch (error) {
        console.error('Error resetting user state:', error);
        dispatch({ type: "SET_ERROR", payload: "Failed to reset user state" });
        return false;
    }
};

const fetchUserData = (dispatch) => async (idToken) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const response = await api.get("/auth/user", {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        
        const userData = response.data;
        
        // If the user has a profilePicturePath, get the download URL
        if (userData.profilePicturePath) {
            try {
                // Get the profile picture URL using the utility function and pass the idToken
                const profilePictureUrl = await getProfilePictureUrl(userData, idToken);
                
                // Update the user data with the profile picture URL
                if (profilePictureUrl) {
                    userData.profilePicture = profilePictureUrl;
                }
            } catch (error) {
                console.error("Error loading profile picture:", error);
                // Continue with user data even if profile picture loading fails
            }
        }
        
        dispatch({ type: "SET_USER_DATA", payload: userData });
    } catch (error) {
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.message || "Failed to fetch user data" 
        });
    }
};

const updateProfile = (dispatch) => async (idToken, updates) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const result = await updateUserProfile(idToken, updates);
        
        if (result.success) {
            dispatch({ type: "UPDATE_USER", payload: result.updatedUser });
            return true;
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return false;
        }
    } catch (error) {
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.message || "Profile update failed" 
        });
        return false;
    }
};

import { addDays } from "date-fns";

const addCalendarEvent = (dispatch) => async (selectedDate, eventData) => {
    try {
        const idToken = await AsyncStorage.getItem("idToken"); 

        // Adjust for Firebase/server timezone issue +1 DAY
        const adjustedDate = addDays(new Date(selectedDate), 1);
        const formattedDate = adjustedDate.toISOString().split('T')[0]; 

        const payload = {
            ...eventData,
            date: formattedDate,
        };

        const response = await api.post("/users/events", payload, {
            headers: { Authorization: `Bearer ${idToken}` }
        });

        const createdEvent = response.data.event;

        dispatch({
            type: "ADD_CALENDAR_EVENT",
            payload: createdEvent,
        });

        return createdEvent;
    } catch (error) {
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.error || "Failed to add calendar event" 
        });
        return null;
    }
}; 

const getUserCalendarEvents = (dispatch) => async (startDate, endDate) => {
    try {
        const idToken = await AsyncStorage.getItem('idToken');
        
        // Check if we have a FIREBASE_INDEX_AVAILABLE flag in storage
        const indexAvailable = await AsyncStorage.getItem('FIREBASE_INDEX_AVAILABLE');
        const hasIndex = indexAvailable === 'true';
        
        // Only attempt date filtering on the server if we know the index exists
        if (hasIndex && startDate && endDate) {
            const filteredUrl = `/users/events?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
            try {
                const response = await api.get(filteredUrl, {
                    headers: { Authorization: `Bearer ${idToken}` }
                });
                
                const events = response.data.events || {};
                dispatch({ type: "SET_CALENDAR_EVENTS", payload: events });
                return events;
            } catch (error) {
                // If we get an index error, set the flag to false for future calls
                if (error.response?.data?.error?.includes('requires an index')) {
                    await AsyncStorage.setItem('FIREBASE_INDEX_AVAILABLE', 'false');
                }
                // Continue to fallback
            }
        }
        
        // Only fetch events for dates we don't already have
        let existingEvents = {};
        try {
            const state = await AsyncStorage.getItem('userState');
            if (state) {
                const parsedState = JSON.parse(state);
                existingEvents = parsedState?.user?.events || {};
            }
        } catch (e) {
            // Ignore errors reading state
        }
        
        // Fallback: Get all events and filter client-side
        const response = await api.get("/users/events", {
            headers: { Authorization: `Bearer ${idToken}` }
        });
        
        const allEvents = response.data.events || {};
        
        // Apply client-side filtering if needed
        let filteredEvents = allEvents;
        if (startDate && endDate) {
            filteredEvents = {};
            
            // Only include events for the requested date range
            Object.keys(allEvents).forEach(dateKey => {
                if (dateKey >= startDate && dateKey <= endDate) {
                    filteredEvents[dateKey] = allEvents[dateKey];
                }
            });
        }
        
        dispatch({ type: "SET_CALENDAR_EVENTS", payload: filteredEvents });
        return filteredEvents;
    } catch (error) {
        console.error('Error in getUserCalendarEvents:', error.response || error);
        dispatch({
            type: "SET_ERROR",
            payload: error.response?.data?.error || "Failed to fetch calendar events"
        });
        return null;
    }
};

const deleteCalendarEvent = (dispatch) => async (idToken, eventId) => {
    try {
        const response = await api.delete(`/users/events/${eventId}`, {
            headers: { Authorization: `Bearer ${idToken}` }
        });

        if (response.data.success) {
            // Find and remove the event from the user's events in state
            dispatch({
                type: "REMOVE_CALENDAR_EVENT",
                payload: { eventId }
            });
        }

        return response.data.success;
    } catch (error) {
        dispatch({
            type: "SET_ERROR",
            payload: error.response?.data?.error || "Failed to delete event"
        });
        return false;
    }
};

const incrementStreak = (dispatch) => () => {
    const today = new Date().toISOString().split('T')[0];
    dispatch({ 
        type: "INCREMENT_STREAK",
        payload: { today }
     });
};

const incrementPhysio = (dispatch) => () => {
    dispatch({ type: "INCREMENT_PHYSIO" });
};

const updateBraceWornHoursUser = (dispatch) => (hours) => {
    dispatch({ type: "UPDATE_BRACE_HOURS", payload: { hours } });
};

const deleteUserAccountData = (dispatch) => async () => {
    try {
        // Clear user state from AsyncStorage
        await AsyncStorage.removeItem('userState');
        
        // Reset state
        dispatch({ type: "RESET" });
        return true;
    } catch (error) {
        console.error('Error deleting user account data:', error);
        dispatch({ type: "SET_ERROR", payload: "Failed to delete user account data" });
        return false;
    }
};

const setStreak = (dispatch) => (newStreak, lastStreakUpdate) => {
    dispatch({ 
        type: "SET_STREAK",
        payload: {
            newStreak,
            lastStreakUpdate
        }
    });
};

const resetDailyBraceHours = (dispatch) => async () => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get last tracked date from AsyncStorage
        const lastTrackedDate = await AsyncStorage.getItem('lastUserBraceTrackingDate');
        
        // Only reset if it's a new day
        if (lastTrackedDate !== today) {
            // Update last tracked date
            await AsyncStorage.setItem('lastUserBraceTrackingDate', today);
            
            // Reset hours for today
            dispatch({
                type: "RESET_DAILY_BRACE_HOURS",
                payload: { today }
            });
            
            console.log("User daily brace hours reset for new day:", today);
        }
    } catch (error) {
        console.error("Error resetting user daily brace hours:", error);
    }
};

const addUserPhysioWorkout = (dispatch) => async (workout, date, dayOfWeek, scheduledWorkouts) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        
        // Get current user's ID token
        const idToken = await AsyncStorage.getItem('idToken');
        if (!idToken) {
            dispatch({ type: "SET_ERROR", payload: "Authentication required" });
            return { success: false, error: "Authentication required" };
        }
        
        const result = await addPhysioWorkout(idToken, workout, date, dayOfWeek);
        
        if (result.success) {
            // Update local state
            dispatch({ 
                type: "ADD_PHYSIO_WORKOUT", 
                payload: {
                    date: result.date,
                    workout,
                    dayOfWeek,
                    scheduledWorkouts
                }
            });
            
            return { 
                success: true, 
                date: result.date,
                achievements: result.achievements || {}
            };
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return { success: false, error: result.error };
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || "Failed to add workout";
        dispatch({ type: "SET_ERROR", payload: errorMsg });
        return { success: false, error: errorMsg };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const signOut = (dispatch) => async () => {
    try {
        // Clear auth state
        await AsyncStorage.removeItem('idToken');
        await AsyncStorage.removeItem('refreshToken');
        
        // Sign out from Firebase
        await auth.signOut();
        
        // Dispatch sign out action
        dispatch({ type: "SIGN_OUT" });
        
        return true;
    } catch (error) {
        console.error("Error signing out:", error);
        dispatch({
            type: "SET_ERROR",
            payload: error.message || "Failed to sign out"
        });
        return false;
    }
};

const updateProfilePicture = (dispatch) => async (imageUri) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        
        // Get the current user's ID token
        const idToken = await AsyncStorage.getItem('idToken');
        if (!idToken) {
            dispatch({ type: "SET_ERROR", payload: "Authentication required" });
            return { success: false, error: "Authentication required" };
        }
        
        // Upload the profile picture
        const result = await uploadProfilePicture(idToken, imageUri);
        
        if (result.success) {
            // Update the user state with both the temporary URL and the path
            dispatch({ 
                type: "UPDATE_PROFILE_PICTURE", 
                payload: {
                    profilePictureUrl: result.profilePictureUrl,
                    profilePicturePath: result.profilePicturePath
                }
            });
            return { success: true };
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return { success: false, error: result.error };
        }
    } catch (error) {
        console.error('Profile picture update error:', error);
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.message || "Failed to update profile picture" 
        });
        return { success: false, error: "Failed to update profile picture" };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

export const { Provider, Context } = createDataContext(
    userReducer,
    { 
        fetchUserData, 
        updateProfile,
        resetUser,
        addCalendarEvent,
        getUserCalendarEvents,
        deleteCalendarEvent,
        incrementStreak,
        incrementPhysio,
        updateBraceWornHoursUser,
        deleteUserAccountData,
        setStreak,
        resetDailyBraceHours,
        addUserPhysioWorkout,
        signOut,
        updateProfilePicture
    },
    { user: null, loading: false, error: null }
);