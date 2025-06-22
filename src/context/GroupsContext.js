import createDataContext from './createDataContext';
import api from '../utilities/backendApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Action types
const SET_LOADING = 'set_loading';
const SET_ERROR = 'set_error';
const SET_GROUPS = 'set_groups';
const SET_USER_GROUPS = 'set_user_groups';
const SET_GROUP_DETAILS = 'set_group_details';
const SET_GROUP_MESSAGES = 'set_group_messages';
const ADD_GROUP = 'add_group';
const UPDATE_GROUP = 'update_group';
const REMOVE_GROUP = 'remove_group';
const ADD_MESSAGE = 'add_message';
const CLEAR_GROUPS_CACHE = 'clear_groups_cache';

// Reducer
const groupsReducer = (state, action) => {
  switch (action.type) {
    case SET_LOADING:
      return { ...state, loading: action.payload };
    case SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case SET_GROUPS:
      return { 
        ...state, 
        groups: action.payload, 
        loading: false, 
        error: null 
      };
    case SET_USER_GROUPS:
      return { 
        ...state, 
        userGroups: action.payload, 
        loading: false, 
        error: null 
      };
    case SET_GROUP_DETAILS:
      return {
        ...state,
        groupDetails: {
          ...state.groupDetails,
          [action.payload.groupId]: action.payload.details
        }
      };
    case SET_GROUP_MESSAGES:
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [action.payload.groupId]: action.payload.messages
        }
      };
    case ADD_GROUP:
      return {
        ...state,
        groups: [action.payload, ...state.groups],
        userGroups: [action.payload, ...state.userGroups]
      };
    case UPDATE_GROUP:
      const updatedGroups = state.groups.map(group =>
        group.id === action.payload.id ? { ...group, ...action.payload } : group
      );
      const updatedUserGroups = state.userGroups.map(group =>
        group.id === action.payload.id ? { ...group, ...action.payload } : group
      );
      return {
        ...state,
        groups: updatedGroups,
        userGroups: updatedUserGroups
      };
    case REMOVE_GROUP:
      return {
        ...state,
        userGroups: state.userGroups.filter(group => group.id !== action.payload)
      };
    case ADD_MESSAGE:
      const currentMessages = state.groupMessages[action.payload.groupId] || [];
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [action.payload.groupId]: [...currentMessages, action.payload.message]
        }
      };
    case CLEAR_GROUPS_CACHE:
      return {
        ...state,
        groups: [],
        userGroups: [],
        groupDetails: {},
        groupMessages: {},
        error: null
      };
    default:
      return state;
  }
};

// Actions
const setLoading = (dispatch) => (loading) => {
  dispatch({ type: SET_LOADING, payload: loading });
};

const setError = (dispatch) => (error) => {
  dispatch({ type: SET_ERROR, payload: error });
};

const getAllGroups = (dispatch) => async (searchOptions = {}) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    dispatch({ type: SET_LOADING, payload: true });
    
    const params = new URLSearchParams();
    if (searchOptions.search) params.append('search', searchOptions.search);
    if (searchOptions.visibility) params.append('visibility', searchOptions.visibility);
    if (searchOptions.tags) params.append('tags', searchOptions.tags);
    if (searchOptions.limit) params.append('limit', searchOptions.limit);
    if (searchOptions.offset) params.append('offset', searchOptions.offset);

    const response = await api.get(`/groups?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ type: SET_GROUPS, payload: response.data.groups });
    } else {
      throw new Error(response.data.error || 'Failed to fetch groups');
    }
  } catch (error) {
    console.error('Get all groups error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to fetch groups' });
  }
};

const getUserGroups = (dispatch) => async () => {
  try {
    dispatch({ type: SET_LOADING, payload: true });
    const idToken = await AsyncStorage.getItem('idToken');
    
    const response = await api.get('/groups/my-groups', {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ type: SET_USER_GROUPS, payload: response.data.groups });
    } else {
      throw new Error(response.data.error || 'Failed to fetch user groups');
    }
  } catch (error) {
    console.error('Get user groups error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to fetch user groups' });
  }
};

const createGroup = (dispatch) => async (groupData) => {
  try {
    dispatch({ type: SET_LOADING, payload: true });
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.post('/groups', groupData, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ type: ADD_GROUP, payload: response.data.group });
      return response.data.group;
    } else {
      throw new Error(response.data.error || 'Failed to create group');
    }
  } catch (error) {
    console.error('Create group error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to create group' });
    throw error;
  }
};

const joinGroup = (dispatch) => async (groupId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.post(`/groups/${groupId}/join`, {}, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      // Refresh user groups after joining
      getUserGroups(dispatch)();
      return true;
    } else {
      throw new Error(response.data.error || 'Failed to join group');
    }
  } catch (error) {
    console.error('Join group error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to join group' });
    throw error;
  }
};

const leaveGroup = (dispatch) => async (groupId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.delete(`/groups/${groupId}/leave`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ type: REMOVE_GROUP, payload: groupId });
      return true;
    } else {
      throw new Error(response.data.error || 'Failed to leave group');
    }
  } catch (error) {
    console.error('Leave group error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to leave group' });
    throw error;
  }
};

const getGroupDetails = (dispatch) => async (groupId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.get(`/groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ 
        type: SET_GROUP_DETAILS, 
        payload: { 
          groupId, 
          details: {
            group: response.data.group,
            members: response.data.members,
            isUserMember: response.data.isUserMember
          }
        }
      });
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch group details');
    }
  } catch (error) {
    console.error('Get group details error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to fetch group details' });
    throw error;
  }
};

const getGroupMessages = (dispatch) => async (groupId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.before) params.append('before', options.before);

    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.get(`/groups/${groupId}/messages?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      dispatch({ 
        type: SET_GROUP_MESSAGES, 
        payload: { 
          groupId, 
          messages: response.data.messages 
        }
      });
      return response.data.messages;
    } else {
      throw new Error(response.data.error || 'Failed to fetch group messages');
    }
  } catch (error) {
    console.error('Get group messages error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to fetch group messages' });
    throw error;
  }
};

const sendMessage = (dispatch) => async (groupId, messageData) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.post(`/groups/${groupId}/messages`, messageData, {
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    if (response.data.success) {
      // Optionally add the message to local state immediately for better UX
      // You might want to refresh messages or add it optimistically
      return response.data.messageId;
    } else {
      throw new Error(response.data.error || 'Failed to send message');
    }
  } catch (error) {
    console.error('Send message error:', error);
    dispatch({ type: SET_ERROR, payload: error.message || 'Failed to send message' });
    throw error;
  }
};

const clearGroupsCache = (dispatch) => () => {
  dispatch({ type: CLEAR_GROUPS_CACHE });
};

// Initial state
const initialState = {
  groups: [],
  userGroups: [],
  groupDetails: {},
  groupMessages: {},
  loading: false,
  error: null
};

export const { Provider, Context } = createDataContext(
  groupsReducer,
  {
    setLoading,
    setError,
    getAllGroups,
    getUserGroups,
    createGroup,
    joinGroup,
    leaveGroup,
    getGroupDetails,
    getGroupMessages,
    sendMessage,
    clearGroupsCache
  },
  initialState
); 