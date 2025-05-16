import createDataContext from "./createDataContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default pre-surgery checklist items
const defaultChecklistItems = [
  { id: 1, label: 'Complete pre-op blood work', deadline: 'ASAP', completed: false },
  { id: 2, label: 'Meet with anesthesiologist', deadline: '5 days before', completed: false },
  { id: 3, label: 'Stop taking NSAIDs', deadline: '7 days before', completed: false },
  { id: 4, label: 'Prepare recovery area at home', deadline: '3 days before', completed: false },
  { id: 5, label: 'Pack hospital bag', deadline: '1 day before', completed: false },
  { id: 6, label: 'Shower with antibacterial soap', deadline: 'Night before', completed: false },
];

// Storage keys
const CHECKLIST_STORAGE_KEY = 'presurgeryChecklist';
const PLANNED_SURGERY_DATE_KEY = 'plannedSurgeryDate';

const preSurgeryReducer = (state, action) => {
  switch (action.type) {
    case "SET_PRESURGERY_DATA":
      return {
        ...state,
        checklistItems: action.payload.checklistItems || state.checklistItems,
        plannedSurgeryDate: action.payload.plannedSurgeryDate || state.plannedSurgeryDate,
        loading: false,
        error: null
      };
    case "UPDATE_CHECKLIST_ITEMS":
      return {
        ...state,
        checklistItems: action.payload,
        loading: false,
        error: null
      };
    case "SET_PLANNED_SURGERY_DATE":
      return {
        ...state,
        plannedSurgeryDate: action.payload,
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

const loadPreSurgeryData = (dispatch) => async () => {
  try {
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Load checklist items from AsyncStorage
    const savedChecklistJSON = await AsyncStorage.getItem(CHECKLIST_STORAGE_KEY);
    let checklistItems = defaultChecklistItems;
    
    if (savedChecklistJSON) {
      checklistItems = JSON.parse(savedChecklistJSON);
    } else {
      // If no saved data exists, save the defaults
      await AsyncStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(defaultChecklistItems));
    }
    
    // Load planned surgery date
    const savedSurgeryDate = await AsyncStorage.getItem(PLANNED_SURGERY_DATE_KEY);
    let plannedSurgeryDate = '08/05/2025'; // Default
    
    if (savedSurgeryDate) {
      plannedSurgeryDate = savedSurgeryDate;
    } else {
      // If no saved date exists, save the default
      await AsyncStorage.setItem(PLANNED_SURGERY_DATE_KEY, plannedSurgeryDate);
    }
    
    // Update the state with loaded data
    dispatch({
      type: "SET_PRESURGERY_DATA",
      payload: {
        checklistItems,
        plannedSurgeryDate
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error loading pre-surgery data:', error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.message || "Failed to load pre-surgery data" 
    });
    return false;
  } finally {
    dispatch({ type: "SET_LOADING", payload: false });
  }
};

const updateChecklistItems = (dispatch) => async (updatedItems) => {
  try {
    // Save updated items to AsyncStorage
    await AsyncStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(updatedItems));
    
    // Update state
    dispatch({
      type: "UPDATE_CHECKLIST_ITEMS",
      payload: updatedItems
    });
    
    return true;
  } catch (error) {
    console.error('Error updating checklist items:', error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.message || "Failed to update checklist items" 
    });
    return false;
  }
};

const setPlannedSurgeryDate = (dispatch) => async (dateStr) => {
  try {
    // Save surgery date to AsyncStorage
    await AsyncStorage.setItem(PLANNED_SURGERY_DATE_KEY, dateStr);
    
    // Update state
    dispatch({ type: "SET_PLANNED_SURGERY_DATE", payload: dateStr });
    
    return true;
  } catch (error) {
    console.error('Error setting planned surgery date:', error);
    dispatch({ 
      type: "SET_ERROR", 
      payload: error.message || "Failed to set planned surgery date" 
    });
    return false;
  }
};

export const { Provider, Context } = createDataContext(
  preSurgeryReducer,
  { 
    loadPreSurgeryData,
    updateChecklistItems,
    setPlannedSurgeryDate
  },
  { 
    checklistItems: defaultChecklistItems,
    plannedSurgeryDate: '08/05/2025',
    loading: false,
    error: null
  }
); 