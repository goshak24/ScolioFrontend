import createDataContext from "./createDataContext";
import api from "../utilities/backendApi";
import userCache from "../utilities/userCache";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device'; 
import Constants from 'expo-constants';

const notificationReducer = (state, action) => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload };
      default:
        return state;
    }
  };

  const registerForNotifications = (dispatch) => async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
  
        const idToken = await AsyncStorage.getItem('idToken');
        
        if (!Device.isDevice) {
          console.log('Must use physical device for Push Notifications');
          return;
        }
  
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
  
        if (finalStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
  
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
  
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
  
        const token = tokenData.data;
        
        // Fix the API call structure
        await api.post('/notifications/register-token', 
          { token }, 
          { 
            headers: { 
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            } 
          }
        );
  
        dispatch({ type: 'SET_TOKEN', payload: token });
  
      } catch (error) {
        console.error('Error registering for notifications:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
};

const checkToken = (dispatch) => async () => {
    try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        const idToken = await AsyncStorage.getItem('idToken');
        
        const response = await api.post('/notifications/check-token', {}, {
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            dispatch({ type: 'SET_TOKEN', payload: response.data.token });
            return true
        } else {
            return false
        }
    } catch (error) {
        console.error('Error checking for notifications:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
    }
} 

export const { Context, Provider } = createDataContext(
    notificationReducer,
    {
      registerForNotifications,
      checkToken,
    },
    {
      loading: false,
      error: null
    }
  );