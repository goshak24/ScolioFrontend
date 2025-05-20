import createDataContext from './createDataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utilities/backendApi';

// Reducer to handle state changes
const painTrackingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PAIN_LOGS':
      return { ...state, painLogs: action.payload, error: null, loading: false };
    case 'ADD_PAIN_LOG':
      return { 
        ...state, 
        painLogs: [...state.painLogs, action.payload], 
        error: null, 
        loading: false 
      };
    case 'DELETE_PAIN_LOG':
      return { 
        ...state, 
        painLogs: state.painLogs.filter(log => log.id !== action.payload), 
        error: null, 
        loading: false 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Save pain logs to AsyncStorage
const savePainLogsToStorage = async (painLogs) => {
  try {
    await AsyncStorage.setItem('painLogs', JSON.stringify(painLogs));
  } catch (error) {
    console.error('Error saving pain logs to storage:', error);
  }
};

// Load pain logs from AsyncStorage
const loadPainLogs = dispatch => async () => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    const storedLogs = await AsyncStorage.getItem('painLogs');
    
    if (storedLogs) {
      dispatch({ type: 'SET_PAIN_LOGS', payload: JSON.parse(storedLogs) });
    } else {
      dispatch({ type: 'SET_PAIN_LOGS', payload: [] });
    }
  } catch (error) {
    console.error('Error loading pain logs:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load pain logs' });
  }
};

// Load pain logs initially from Database for month
const dbLoadPainLogsForMonth = dispatch => async (monthStr) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Parse the month string which should be in format YYYY-MM
    const [year, month] = monthStr.split('-').map(num => parseInt(num, 10));
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }
    
    // Create first and last day of the month
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
    
    console.log('Loading pain logs from', firstDay, 'to', lastDay);
    
    try {
      const response = await api.get(`/pain-track/get-logs-by-date-range?startDate=${firstDay}&endDate=${lastDay}`);
      const painLogs = response.data.painLogs;

      // Save to AsyncStorage
      await AsyncStorage.setItem('painLogs', JSON.stringify(painLogs));

      dispatch({ type: 'SET_PAIN_LOGS', payload: painLogs || [] });

    } catch (apiError) {
      console.error('API Error:', apiError);
      // If API call fails, we still keep the local data
      console.log('Using local data instead');
    }
  } catch (error) {
    console.error('Error loading pain logs for month:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load pain logs for month' });
  }
};




// Save a new pain log to Database and AsyncStorage 
const savePainLog = dispatch => async (painLogData) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Validate required fields
    if (!painLogData.bodyParts || painLogData.bodyParts.length === 0) {
      throw new Error('At least one body part must be selected');
    }
    
    if (painLogData.painIntensity === undefined || painLogData.painIntensity < 0 || painLogData.painIntensity > 10) {
      throw new Error('Valid pain intensity (0-10) is required');
    }
    
    try {
      // Send data to backend API
      const response = await api.post('pain-track/save-log', painLogData);
      
      // Create a new pain log object with the response data
      const newPainLog = {
        ...painLogData,
        id: response.data.painLogId,
        createdAt: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };
      
      // Update state with the new pain log
      dispatch({ type: 'ADD_PAIN_LOG', payload: newPainLog });
      
      // Get current logs and update storage
      const storedLogs = await AsyncStorage.getItem('painLogs');
      let updatedLogs = [];
      
      if (storedLogs) {
        updatedLogs = [...JSON.parse(storedLogs), newPainLog];
      } else {
        updatedLogs = [newPainLog];
      }
      
      await savePainLogsToStorage(updatedLogs);
      
      return { success: true, message: "Pain log saved successfully" };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Failed to save pain log');
    }
  } catch (error) {
    console.error('Error saving pain log:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message });
    return { success: false, error: error.message };
  }
};

// Get pain logs for a specific date from AsyncStorage
const getPainLogsByDate = dispatch => (date) => {
  try {
    // This function doesn't need to dispatch any actions as it's just a selector
    // It will use the current state from the context
    return (state) => state.painLogs.filter(log => log.date === date);
  } catch (error) {
    console.error('Error getting pain logs by date:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to get pain logs' });
    return [];
  }
};

// Delete a pain log from AsyncStorage
const deletePainLog = dispatch => async (logId) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // In the future, this will be an API call to delete from the server
    // await api.delete(`pain-track/delete-log/${logId}`);
    
    // Update state
    dispatch({ type: 'DELETE_PAIN_LOG', payload: logId });
    
    // Update storage
    const storedLogs = await AsyncStorage.getItem('painLogs');
    if (storedLogs) {
      const updatedLogs = JSON.parse(storedLogs).filter(log => log.id !== logId);
      await savePainLogsToStorage(updatedLogs);
    }
    
    return { success: true, message: "Pain log deleted successfully" };
  } catch (error) {
    console.error('Error deleting pain log:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message });
    return { success: false, error: error.message };
  }
};

// Clear any errors
const clearError = dispatch => () => {
  dispatch({ type: 'SET_ERROR', payload: null });
};

const clearPainLogs = dispatch => async () => {
  dispatch({ type: 'SET_PAIN_LOGS', payload: [] });
  await AsyncStorage.removeItem('painLogs');
}; 

// Export the context and provider
export const { Context, Provider } = createDataContext(
  painTrackingReducer,
  {
    loadPainLogs,
    savePainLog,
    getPainLogsByDate,
    deletePainLog,
    clearError,
    clearPainLogs, 
    dbLoadPainLogsForMonth 
  },
  {
    painLogs: [],
    loading: false,
    error: null
  }
);
