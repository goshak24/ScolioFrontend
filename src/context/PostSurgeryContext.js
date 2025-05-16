import createDataContext from "./createDataContext";
import api from "../utilities/backendApi";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { incrementWalkingMinutes as incrementWalkingMinutesApi, updateWalkingMinutes as updateWalkingMinutesApi } from "./UserFunctionsHelper";

// Default recovery tasks
const defaultRecoveryTasks = [
  { id: 1, label: 'Take pain medication', frequency: 'Every 6 hours', completed: false },
  { id: 2, label: 'Change dressing', frequency: 'Daily', completed: false },
  { id: 3, label: 'Walk around the house', frequency: '3-4 times daily', completed: false },
  { id: 4, label: 'Do breathing exercises', frequency: 'Every 2 hours', completed: false },
  { id: 5, label: 'Check incision for signs of infection', frequency: 'Daily', completed: false },
];

// Storage keys
const TASKS_STORAGE_KEY = 'recoveryTasks';
const LAST_RESET_DATE_KEY = 'lastRecoveryTasksResetDate';
const LAST_WALKING_RESET_DATE_KEY = 'lastWalkingResetDate';
const SURGERY_DATE_KEY = 'surgeryDate';

const postSurgeryReducer = (state, action) => {
  switch (action.type) {
    case "SET_RECOVERY_DATA":
      return {
        ...state,
        recoveryTasks: action.payload.recoveryTasks || state.recoveryTasks,
        walkingMinutes: action.payload.walkingMinutes !== undefined ? 
          action.payload.walkingMinutes : state.walkingMinutes,
        walkingHistory: action.payload.walkingHistory || state.walkingHistory,
        loading: false,
        error: null
      };
    case "UPDATE_WALKING_MINUTES":
      return {
        ...state,
        walkingMinutes: action.payload.minutes,
        walkingHistory: {
          ...state.walkingHistory,
          [action.payload.date]: action.payload.minutes
        },
        loading: false,
        error: null
      };
    case "UPDATE_RECOVERY_TASKS":
      return {
        ...state,
        recoveryTasks: action.payload,
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

const fetchWalkingData = (dispatch) => async () => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Get the token
    const idToken = await AsyncStorage.getItem('idToken');
    if (!idToken) {
      throw new Error('No authentication token found');
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const lastWalkingResetDate = await AsyncStorage.getItem(LAST_WALKING_RESET_DATE_KEY);
    const resetWalkingMinutes = lastWalkingResetDate !== today;
    
    if (resetWalkingMinutes) {
      // If it's a new day, reset walking minutes to 0
      console.log('New day detected in fetchWalkingData, resetting walking minutes to 0');
      await AsyncStorage.setItem(LAST_WALKING_RESET_DATE_KEY, today);
      
      // Reset minutes in the API using the helper function
      const result = await updateWalkingMinutesApi(idToken, 0);
      if (!result.success) {
        console.error('API reported error resetting walking minutes:', result.error);
      }
      
      // Update state
      dispatch({
        type: "UPDATE_WALKING_MINUTES",
        payload: {
          minutes: 0,
          date: today
        }
      });
      
      return { success: true, minutes: 0 };
    }
    
    // If it's not a new day, make a direct API call to get the latest walking data
    try {
      const response = await api.get("/users/post-surgery/walking", {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      
      if (response.data.success) {
        const walkingData = response.data;
        let todayMinutes = 0;
        
        // Check if walkingHistory exists and has today's entry
        if (walkingData.walkingHistory && walkingData.walkingHistory[today] !== undefined) {
          todayMinutes = walkingData.walkingHistory[today];
        }
        
        // Update state with the data from API
        dispatch({
          type: "UPDATE_WALKING_MINUTES",
          payload: {
            minutes: todayMinutes,
            date: today
          }
        });
        
        return { success: true, minutes: todayMinutes, walkingHistory: walkingData.walkingHistory };
      } else {
        console.log('No walking data found from API');
        return { success: false };
      }
    } catch (error) {
      console.error('Error fetching walking data:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('Error fetching walking data:', error);
    dispatch({ type: "SET_ERROR", payload: error.message || "Failed to fetch walking data" });
    return { success: false, error: error.message || "Failed to fetch walking data" };
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const loadRecoveryData = (dispatch) => async () => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // --- Walking minutes logic ---
    let walkingMinutes = 0;
    let walkingHistory = {};
    const lastWalkingResetDate = await AsyncStorage.getItem(LAST_WALKING_RESET_DATE_KEY);
    const resetWalkingMinutes = lastWalkingResetDate !== today;
    
    if (resetWalkingMinutes) {
      // If it's a new day, reset walking minutes to 0
      console.log('New day detected, resetting walking minutes to 0');
      await AsyncStorage.setItem(LAST_WALKING_RESET_DATE_KEY, today);
      
      // Reset in API if possible
      try {
        const idToken = await AsyncStorage.getItem('idToken');
        if (idToken) {
          // Reset minutes in the API using the helper function
          const result = await updateWalkingMinutesApi(idToken, 0);
          if (!result.success) {
            console.error('API reported error resetting walking minutes:', result.error);
          }
        }
      } catch (apiError) {
        console.error('Error resetting walking minutes in API:', apiError);
        // Continue execution - we'll use the local value regardless
      }
      
      // Reset locally regardless of API success
      walkingMinutes = 0;
      // Add today's entry to walking history with 0 minutes
      walkingHistory = { [today]: 0 };
    } else {
      // If it's the same day, load current walking minutes
      try {
        const idToken = await AsyncStorage.getItem('idToken');
        if (idToken) {
          const response = await api.get("/users/post-surgery/walking", {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          
          if (response.data.success) {
            // Get today's minutes from walkingHistory if available
            if (response.data.walkingHistory && response.data.walkingHistory[today] !== undefined) {
              walkingMinutes = response.data.walkingHistory[today];
            }
            walkingHistory = response.data.walkingHistory || {};
          }
        }
      } catch (walkingError) {
        console.error('Error fetching walking data:', walkingError);
        // Try to get from user state as fallback
        try {
          const userState = await AsyncStorage.getItem('userState');
          const userData = userState ? JSON.parse(userState).user : null;
          if (userData?.treatmentData?.postSurgery?.walkingHistory?.[today] !== undefined) {
            walkingMinutes = userData.treatmentData.postSurgery.walkingHistory[today];
            walkingHistory = userData.treatmentData.postSurgery.walkingHistory;
          }
        } catch (stateError) {
          console.error('Error reading user state:', stateError);
        }
      }
    }

    // --- Recovery task reset logic ---
    const lastResetDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
    let recoveryTasks = defaultRecoveryTasks;
    if (lastResetDate !== today) {
      // Reset tasks to default (uncompleted)
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(defaultRecoveryTasks));
      await AsyncStorage.setItem(LAST_RESET_DATE_KEY, today);
      recoveryTasks = defaultRecoveryTasks;
    } else {
      // Load saved tasks if it's the same day
      const savedTasksJSON = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (savedTasksJSON) {
        recoveryTasks = JSON.parse(savedTasksJSON);
      }
    }

    // Update state with all data
    dispatch({ 
      type: "SET_RECOVERY_DATA", 
      payload: {
        recoveryTasks,
        walkingMinutes,
        walkingHistory
      }
    });
    return true;
  } catch (error) {
    console.error('Error loading recovery data:', error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.message || "Failed to load recovery data" 
    });
    return false;
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const updateRecoveryTasks = (dispatch) => async (taskId) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Get current tasks
    const savedTasksJSON = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    const currentTasks = savedTasksJSON ? JSON.parse(savedTasksJSON) : defaultRecoveryTasks;
    
    // Toggle the completed status of the task
    const updatedTasks = currentTasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
    
    // Update state
    dispatch({ type: "UPDATE_RECOVERY_TASKS", payload: updatedTasks });
    
    return true;
  } catch (error) {
    console.error('Error updating recovery tasks:', error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.message || "Failed to update recovery tasks" 
    });
    return false;
  }
};

const incrementWalkingMinutes = (dispatch) => async (increment) => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Get the token
    const idToken = await AsyncStorage.getItem('idToken');
    if (!idToken) {
      throw new Error('No authentication token found');
    }
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Call the API
    const result = await incrementWalkingMinutesApi(idToken, increment);
    
    if (result.success) {
      // Update state
      dispatch({
        type: "UPDATE_WALKING_MINUTES",
        payload: {
          minutes: result.minutes,
          date: today
        }
      });
      
      return { success: true, minutes: result.minutes, date: today };
    } else {
      dispatch({ type: "SET_ERROR", payload: result.error });
      return { success: false, error: result.error };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to increment walking minutes";
    dispatch({ type: "SET_ERROR", payload: errorMessage });
    return { success: false, error: errorMessage };
  }
};

export const { Provider, Context } = createDataContext(
  postSurgeryReducer,
  { 
    loadRecoveryData,
    updateRecoveryTasks,
    incrementWalkingMinutes,
    fetchWalkingData
  },
  { 
    recoveryTasks: defaultRecoveryTasks,
    walkingMinutes: 0,
    walkingHistory: {},
    loading: false,
    error: null
  }
); 