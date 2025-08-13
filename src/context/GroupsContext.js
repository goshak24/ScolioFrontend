import createDataContext from './createDataContext';
import api, { verifyBackendTokenAndSetupFirebase } from '../utilities/backendApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit as fsLimit,
  Timestamp,
  startAfter
} from 'firebase/firestore';

// Cache config
const GROUP_MESSAGES_CACHE_PREFIX = 'group_messages_';
const GROUP_MESSAGES_TTL = 24 * 60 * 60 * 1000; // 24 hours
const GROUP_MESSAGES_FRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Helpers: cache read/write with de-dup
const readGroupMessagesCache = async (groupId) => {
  try {
    const raw = await AsyncStorage.getItem(`${GROUP_MESSAGES_CACHE_PREFIX}${groupId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
};

const writeGroupMessagesCache = async (groupId, messages) => {
  try {
    await AsyncStorage.setItem(
      `${GROUP_MESSAGES_CACHE_PREFIX}${groupId}`,
      JSON.stringify({ messages, timestamp: Date.now() })
    );
  } catch {}
};

const mergeMessagesById = (existing, added) => {
  const byId = new Map((existing || []).map(m => [m.id, m]));
  (added || []).forEach(m => {
    const prev = byId.get(m.id) || {};
    byId.set(m.id, { ...prev, ...m });
  });
  // Preserve chronological order by createdAt if present, else insertion
  const merged = Array.from(byId.values());
  merged.sort((a, b) => {
    const ad = Date.parse(a.createdAt || '');
    const bd = Date.parse(b.createdAt || '');
    if (!isNaN(ad) && !isNaN(bd)) return ad - bd;
    return 0;
  });
  return merged;
};

// Track last seen/newest timestamps per group to scope realtime queries
const lastSeenGroupTimestamps = {};

// Helpers to normalize timestamps
const toMillis = (value) => {
  try {
    if (!value) return null;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value === 'string' || typeof value === 'number') {
      const t = Date.parse(value);
      return isNaN(t) ? null : t;
    }
    return null;
  } catch {
    return null;
  }
};

const getNewestTimestampMillis = (messages) => {
  let max = null;
  (messages || []).forEach((m) => {
    const ts = toMillis(m?.createdAt);
    if (ts !== null && (max === null || ts > max)) max = ts;
  });
  return max;
};

// Action types
const SET_LOADING = 'set_loading';
const SET_ERROR = 'set_error';
const SET_GROUPS = 'set_groups';
const SET_USER_GROUPS = 'set_user_groups';
const SET_GROUP_DETAILS = 'set_group_details';
const SET_GROUP_MESSAGES = 'set_group_messages';
const APPEND_GROUP_MESSAGES = 'append_group_messages';
const ADD_GROUP = 'add_group';
const UPDATE_GROUP = 'update_group';
const REMOVE_GROUP = 'remove_group';
const ADD_MESSAGE = 'add_message';
const CLEAR_GROUPS_CACHE = 'clear_groups_cache';
const SET_GROUP_LISTENER = 'set_group_listener';

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
    case APPEND_GROUP_MESSAGES: {
      const existing = state.groupMessages[action.payload.groupId] || [];
      // De-duplicate by id while appending
      const byId = new Map(existing.map(m => [m.id, m]));
      action.payload.messages.forEach(m => {
        // Overwrite existing with newer fields (replace optimistic with server doc)
        const prev = byId.get(m.id) || {};
        byId.set(m.id, { ...prev, ...m });
      });
      return {
        ...state,
        groupMessages: {
          ...state.groupMessages,
          [action.payload.groupId]: Array.from(byId.values())
        }
      };
    }
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
    case SET_GROUP_LISTENER:
      return {
        ...state,
        activeGroupListener: action.payload || null
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

// Kick a member (admin only)
const kickMember = (dispatch) => async (groupId, memberId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.post(`/groups/${groupId}/kick/${memberId}`, {}, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Kick member error:', error);
    return { success: false, error: error.response?.data?.error || 'Failed to remove member' };
  }
};

// Ban a member (admin only)
const banMember = (dispatch) => async (groupId, memberId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.post(`/groups/${groupId}/ban/${memberId}`, {}, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Ban member error:', error);
    return { success: false, error: error.response?.data?.error || 'Failed to ban member' };
  }
};

const getGroupDetails = (dispatch) => async (groupId, options = {}) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const params = new URLSearchParams();
    if (options.includeMembers === false) params.append('includeMembers', 'false');
    const query = params.toString();
    const response = await api.get(`/groups/${groupId}${query ? `?${query}` : ''}` , {
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

// Lightweight members fetch (on demand for modal)
const getGroupMembers = (dispatch) => async (groupId) => {
  try {
    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.get(`/groups/${groupId}/members`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    if (response.data?.success && Array.isArray(response.data.members)) {
      return response.data.members;
    }
    return [];
  } catch (error) {
    console.error('Get group members error:', error);
    return [];
  }
};

const getGroupMessages = (dispatch) => async (groupId, options = {}) => {
  try {
    const now = Date.now();
    const force = !!options.force;
    const limit = options.limit;

    // Attempt cache
    if (!force) {
      const cached = await readGroupMessagesCache(groupId);
      if (cached && (now - (cached.timestamp || 0)) < GROUP_MESSAGES_TTL) {
        // Use cached
        dispatch({ type: SET_GROUP_MESSAGES, payload: { groupId, messages: cached.messages } });
        // Optionally refresh in background if cache is getting old
        const freshEnough = (now - (cached.timestamp || 0)) < GROUP_MESSAGES_FRESH_THRESHOLD;
        if (!freshEnough) {
          setTimeout(async () => {
            try {
              const params = new URLSearchParams();
              if (limit) params.append('limit', limit);
              const idTokenBg = await AsyncStorage.getItem('idToken');
              const respBg = await api.get(`/groups/${groupId}/messages?${params.toString()}`, { headers: { 'Authorization': `Bearer ${idTokenBg}` } });
              if (respBg.data?.success && Array.isArray(respBg.data.messages)) {
                const merged = mergeMessagesById(cached.messages, respBg.data.messages);
                dispatch({ type: SET_GROUP_MESSAGES, payload: { groupId, messages: merged } });
                writeGroupMessagesCache(groupId, merged);
                // Track newest timestamp for realtime scoping
                const newest = getNewestTimestampMillis(merged);
                if (newest) lastSeenGroupTimestamps[groupId] = newest;
              }
            } catch {}
          }, 50);
        }
        return cached.messages;
      }
    }

    // No valid cache -> fetch
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit);
    if (options.before) params.append('before', options.before);

    const idToken = await AsyncStorage.getItem('idToken');
    const response = await api.get(`/groups/${groupId}/messages?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    });
    if (response.data.success) {
      const messages = response.data.messages || [];
      dispatch({ type: SET_GROUP_MESSAGES, payload: { groupId, messages } });
      writeGroupMessagesCache(groupId, messages);
      const newest = getNewestTimestampMillis(messages);
      if (newest) lastSeenGroupTimestamps[groupId] = newest;
      return messages;
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
      // Optimistically append the message using returned id to avoid duplicate later
      const optimistic = {
        id: response.data.messageId,
        senderId: messageData.senderId,
        senderName: messageData.senderName,
        text: messageData.text || '',
        messageType: messageData.messageType || 'text',
        mediaUrl: messageData.mediaUrl || null,
        deleted: false,
        isEdited: false,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: APPEND_GROUP_MESSAGES, payload: { groupId, messages: [optimistic] } });
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

// Real-time listener for a group's messages (only when user is inside the chat)
// Mirrors DM listener approach: small page, asc order, append-only
let db;
try {
  const app = getApp();
  db = getFirestore(app);
} catch (e) {
  // Firestore not ready in some environments; listener will no-op
}

// Prevent duplicate listeners across renders/screens with ref counting
// Map: groupId -> { unsubscribe: Function, count: number }
const activeMessageListeners = new Map();
let firebaseAuthReady = false;

const listenToGroupMessages = (dispatch) => async (groupId) => {
  if (!db || !groupId) return () => {};

  // Ensure Firebase auth is established for Firestore rules
  try {
    if (!firebaseAuthReady) {
      const authResult = await verifyBackendTokenAndSetupFirebase();
      if (authResult?.success) {
        firebaseAuthReady = true;
      } else {
        console.warn('Groups listener auth setup failed:', authResult?.error);
        // Still attempt to listen; Firestore will error if rules block
      }
    }
  } catch {}

  // Prevent duplicate listeners per group (React strict mode double effects, etc.)
  if (activeMessageListeners.has(groupId)) {
    const entry = activeMessageListeners.get(groupId);
    entry.count += 1;
    const cleanupExisting = () => {
      const current = activeMessageListeners.get(groupId);
      if (!current) return;
      current.count -= 1;
      if (current.count <= 0) {
        try { current.unsubscribe(); } catch {}
        activeMessageListeners.delete(groupId);
      }
    };
    return cleanupExisting;
  }

  // Real-time: listen only to NEW messages after our last seen timestamp
  const msgsRef = collection(db, 'groups', groupId, 'messages');
  const lastSeenMs = lastSeenGroupTimestamps[groupId] || (Date.now() - 5 * 60 * 1000);
  const startTs = Timestamp.fromMillis(lastSeenMs + 1);
  const liveQ = query(
    msgsRef,
    where('deleted', '==', false),
    where('createdAt', '>', startTs),
    orderBy('createdAt', 'asc'),
    fsLimit(10)
  );

  const unsubscribe = onSnapshot(liveQ, { includeMetadataChanges: false }, async (snapshot) => {
    try {
      // Only process 'added' changes to minimize work
      const added = snapshot
        .docChanges()
        .filter((c) => c.type === 'added')
        .map((c) => {
          const data = c.doc.data();
          return { id: c.doc.id, ...data, createdAt: data.createdAt?.toDate?.()?.toISOString() };
        });
      if (added.length > 0) {
        dispatch({ type: APPEND_GROUP_MESSAGES, payload: { groupId, messages: added } });
        // Update cache by merging
        try {
          const cached = await readGroupMessagesCache(groupId);
          const base = cached?.messages || [];
          const merged = mergeMessagesById(base, added);
          writeGroupMessagesCache(groupId, merged);
          const newest = getNewestTimestampMillis(merged);
          if (newest) lastSeenGroupTimestamps[groupId] = newest;
        } catch {}
      }
    } catch (err) {}
  });

  // Register listener with ref count 1
  activeMessageListeners.set(groupId, { unsubscribe, count: 1 });
  // Provide a cleanup that decrements the count and unsubscribes when it hits 0
  const cleanup = () => {
    const current = activeMessageListeners.get(groupId);
    if (!current) return;
    current.count -= 1;
    if (current.count <= 0) {
      try { current.unsubscribe(); } catch {}
      activeMessageListeners.delete(groupId);
    } else {
      activeMessageListeners.set(groupId, current);
    }
  };

  // Optional: track in state for external cleanup, but not required
  dispatch({ type: SET_GROUP_LISTENER, payload: cleanup });
  return cleanup;
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
    getGroupMembers,
    getGroupMessages,
    sendMessage,
    clearGroupsCache,
    listenToGroupMessages,
    kickMember,
    banMember
  },
  initialState
); 