import createDataContext from "./createDataContext";
import { extendStreak, logPhysioSession, updateWornHours, incrementWalkingMinutes, initializeTreatmentData } from "./UserFunctionsHelper";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Instead of importing UserContext, we'll use a reference variable
let _setUserStreak = null;

const activityReducer = (state, action) => {
    switch (action.type) {
        case "SET_ACTIVITY_DATA":
            return {
                ...state,
                ...action.payload,
                loading: false,
                error: null
            };
        case "UPDATE_STREAK":
            return { 
                ...state, 
                streaks: action.payload.newStreak,
                lastStreakUpdate: action.payload.lastStreakUpdate,
                loading: false,
                error: null
            };
        case "UPDATE_PHYSIO":
            return { 
                ...state, 
                physioCount: action.payload.count,
                achievements: action.payload.achievements,
                loading: false,
                error: null
            };
        case "UPDATE_BRACE_HOURS":
            return {
                ...state,
                braceData: {
                    ...state.braceData,
                    ...action.payload.braceData
                },
                loading: false,
                error: null
            };
        case "SET_LOADING":
            return { ...state, loading: action.payload };
        case "SET_ERROR":
            return { ...state, error: action.payload, loading: false };
        case "RESET_ACTIVITY":
            return { 
                streaks: null,
                lastStreakUpdate: null,
                physioCount: 0,
                achievements: [],
                braceData: {},
                loading: false,
                error: null
            };
        case "RESET_DAILY_BRACE_HOURS":
            return {
                ...state,
                braceData: {
                    ...state.braceData,
                    [action.payload.today]: 0 // Reset hours for today
                }
            };
        default:
            return state;
    }
};

// This is the function we'll expose through the context
const setUserContextFunctions = (dispatch) => (setStreakFn) => {
    _setUserStreak = setStreakFn;
};

const getToken = async () => {
    try {
        console.log("Getting token from AsyncStorage...");
        const token = await AsyncStorage.getItem('idToken');
        console.log("Token retrieved:", token ? "Token exists (length: " + token.length + ")" : "No token found");
        return token;
    } catch (error) {
        console.error('Error getting token from storage:', error);
        return null;
    }
};

const fetchActivityData = (dispatch) => async () => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }
        
        // You might want to add an API endpoint to fetch all activity data at once
        // const response = await api.get("/activity", { 
        //   headers: { Authorization: `Bearer ${idToken}` } 
        // });
        // dispatch({ type: "SET_ACTIVITY_DATA", payload: response.data });
    } catch (error) {
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.message || error.message || "Failed to fetch activity data" 
        });
    }
};

const updateBraceWornHours = (dispatch) => async (hours, date = null) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }

        const result = await updateWornHours(idToken, hours, date);
        
        if (result.success) {
            // Get today's date in YYYY-MM-DD format if not provided
            const dateUsed = result.date || (date || new Date().toISOString().split('T')[0]);
            
            // Update the context state with the new hours
            dispatch({
                type: "UPDATE_BRACE_HOURS",
                payload: {
                    braceData: {
                        [dateUsed]: result.totalHours
                    }
                }
            });
            console.log("Updated brace hours:", result);
            return result;
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return result;
        }
    } catch (error) {
        const errorMessage = error.message || "Failed to update brace hours";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return { success: false, error: errorMessage };
    }
};

const updateStreak = (dispatch) => async () => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }
        
        const result = await extendStreak(idToken);
        
        if (result.success) {
            // Always update the ActivityContext state
            dispatch({ 
                type: "UPDATE_STREAK", 
                payload: {
                    newStreak: result.newStreak,
                    lastStreakUpdate: result.lastStreakUpdate
                }
            });
            
            // If we have access to the UserContext's setStreak function, call it
            if (_setUserStreak) {
                _setUserStreak(result.newStreak, result.lastStreakUpdate);
            }
            
            return {
                success: true,
                alreadyUpdatedToday: result.alreadyUpdatedToday || false
            };
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return {
                success: false,
                error: result.error
            };
        }
    } catch (error) {
        dispatch({ 
            type: "SET_ERROR", 
            payload: error.response?.data?.message || error.message || "Failed to update streak" 
        });
        return {
            success: false,
            error: error.response?.data?.message || error.message || "Failed to update streak"
        };
    }
};

const logPhysio = (dispatch) => async (date = null, workoutName = null) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }
        
        const result = await logPhysioSession(idToken, date, workoutName);
        
        if (result.success) {
            dispatch({ 
                type: "UPDATE_PHYSIO", 
                payload: {
                    count: result.newPhysioCount,
                    achievements: result.achievements || {}
                }
            });
            return {
                success: true,
                newPhysioCount: result.newPhysioCount,
                date: result.date,
                totalSessionsForDate: result.totalSessionsForDate,
                achievements: result.achievements || {}, 
                newAchievements: result.newAchievements || {} 
            };
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return { success: false, error: result.error };
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message || "Failed to log physio session";
        dispatch({ 
            type: "SET_ERROR", 
            payload: errorMsg
        });
        return { success: false, error: errorMsg };
    } finally {
        dispatch({ type: "SET_LOADING", payload: false });
    }
};

const resetActivity = (dispatch) => async () => {
    try {
        // Remove any activity data that might be stored in AsyncStorage
        await AsyncStorage.removeItem('activityState');
        
        // Reset state through the reducer
        dispatch({ type: "RESET_ACTIVITY" });
        return true;
    } catch (error) {
        console.error('Error resetting activity state:', error);
        return false;
    }
};

const incrementDailyWalkingMinutes = (dispatch) => async (increment) => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }
        
        const result = await incrementWalkingMinutes(idToken, increment);
        
        if (!result.success) {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return { success: false, error: result.error };
        }
        
        // Just return the result without updating context state
        // Since this function will only call the API but not update the interface
        dispatch({ type: "SET_LOADING", payload: false });
        return { 
            success: true, 
            minutes: result.minutes, 
            increment: result.increment 
        };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to increment walking minutes";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return { success: false, error: errorMessage };
    }
};

// Update the resetDailyBraceHours function
const resetDailyBraceHours = (dispatch) => async () => {
    try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Get last tracked date from AsyncStorage
        const lastTrackedDate = await AsyncStorage.getItem('lastBraceTrackingDate');
        
        // Only reset if it's a new day
        if (lastTrackedDate !== today) {
            // Update last tracked date
            await AsyncStorage.setItem('lastBraceTrackingDate', today);
            
            // Reset hours for today in our local state
            dispatch({
                type: "RESET_DAILY_BRACE_HOURS",
                payload: { today }
            });
            
            console.log("Daily brace hours reset for new day:", today);
        }
    } catch (error) {
        console.error("Error resetting daily brace hours:", error);
    }
};

// Initialize treatment data function
const initializeTreatmentDataAction = (dispatch) => async (accountType = 'brace') => {
    try {
        dispatch({ type: "SET_LOADING", payload: true });
        const idToken = await getToken();
        if (!idToken) {
            throw new Error('No authentication token found');
        }

        const result = await initializeTreatmentData(idToken, accountType);
        
        if (result.success) {
            console.log("Treatment data initialized successfully");
            dispatch({ type: "SET_LOADING", payload: false });
            return result;
        } else {
            dispatch({ type: "SET_ERROR", payload: result.error });
            return result;
        }
    } catch (error) {
        const errorMessage = error.message || "Failed to initialize treatment data";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        return { success: false, error: errorMessage };
    }
};

// Initialize brace tracking on app start 
const initBraceTracking = (dispatch) => async (accountType = 'brace') => {
    try {
        // Reset daily brace hours when the app initializes
        await resetDailyBraceHours(dispatch)();
        
        // Try to initialize treatment data silently (don't show errors if it already exists)
        const idToken = await getToken();
        if (idToken) {
            try {
                await initializeTreatmentData(idToken, accountType);
                console.log("Treatment data initialization attempted");
            } catch (initError) {
                // Silently fail - treatment data might already exist
                console.log("Treatment data might already exist, continuing...");
            }
        }
    } catch (error) {
        console.error("Error initializing brace tracking:", error);
    }
};

// Get persistent timer status
const getPersistentTimerStatus = (dispatch) => async () => {
    try {
        const [isRunning, sessionDate, startTimestamp, totalElapsed] = await Promise.all([
            AsyncStorage.getItem('braceTimer_isRunning'),
            AsyncStorage.getItem('braceTimer_sessionDate'),
            AsyncStorage.getItem('braceTimer_startTimestamp'),
            AsyncStorage.getItem('braceTimer_totalElapsed')
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        
        return {
            isRunning: isRunning === 'true',
            sessionDate,
            isToday: sessionDate === today,
            startTimestamp: startTimestamp ? parseInt(startTimestamp) : null,
            totalElapsed: totalElapsed ? parseInt(totalElapsed) : 0,
            currentElapsed: (isRunning === 'true' && startTimestamp) ? 
                Math.floor((Date.now() - parseInt(startTimestamp)) / 1000) : 
                (totalElapsed ? parseInt(totalElapsed) : 0)
        };
    } catch (error) {
        console.error('Error getting persistent timer status:', error);
        return {
            isRunning: false,
            sessionDate: null,
            isToday: false,
            startTimestamp: null,
            totalElapsed: 0,
            currentElapsed: 0
        };
    }
};

// Clear persistent timer data
const clearPersistentTimerData = (dispatch) => async () => {
    try {
        await Promise.all([
            AsyncStorage.removeItem('braceTimer_startTimestamp'),
            AsyncStorage.removeItem('braceTimer_totalElapsed'),
            AsyncStorage.removeItem('braceTimer_isRunning'),
            AsyncStorage.removeItem('braceTimer_sessionDate'),
            AsyncStorage.removeItem('braceTimer_lastSaveTime')
        ]);
        console.log('Persistent timer data cleared');
        return { success: true };
    } catch (error) {
        console.error('Error clearing persistent timer data:', error);
        return { success: false, error: error.message };
    }
};

export const { Provider, Context } = createDataContext(
    activityReducer,
    { 
        fetchActivityData, 
        updateStreak, 
        logPhysio, 
        updateBraceWornHours, 
        resetActivity, 
        setUserContextFunctions,
        resetDailyBraceHours,
        initBraceTracking, 
        incrementDailyWalkingMinutes,
        initializeTreatmentDataAction,
        getPersistentTimerStatus,
        clearPersistentTimerData
    },
    { 
        streaks: null,
        lastStreakUpdate: null,
        physioCount: 0,
        achievements: [],
        braceData: {},
        loading: false,
        error: null
    }
);