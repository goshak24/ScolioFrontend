import createDataContext from './createDataContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utilities/backendApi';

// Reducer to handle state changes
const assistantReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { 
        ...state, 
        conversations: action.payload, 
        error: null, 
        loading: false 
      };
    case 'ADD_CONVERSATION':
      return { 
        ...state, 
        conversations: [action.payload, ...state.conversations], 
        error: null, 
        loading: false 
      };
    case 'SET_CURRENT_CONVERSATION':
      return {
        ...state,
        currentConversation: action.payload,
        error: null
      };
    case 'ADD_MESSAGE':
      const updatedConversation = state.currentConversation 
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, action.payload]
          }
        : {
            id: new Date().toISOString(),
            messages: [action.payload]
          };
      
      return {
        ...state,
        currentConversation: updatedConversation,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

// Save conversations to AsyncStorage
const saveConversationsToStorage = async (conversations) => {
  try {
    await AsyncStorage.setItem('aiConversations', JSON.stringify(conversations));
  } catch (error) {
    console.error('Error saving AI conversations to storage:', error);
  }
};

/*
// Load conversations from storage
const loadConversations = dispatch => async () => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // First try to get from backend
      const response = await api.get('assistant/conversations');
      dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.conversations || [] });
    } catch (error) {
      console.log('Could not fetch conversations from backend, falling back to local storage');
      
      // Fall back to local storage if backend fails
      const storedConversations = await AsyncStorage.getItem('aiConversations');
      if (storedConversations) {
        dispatch({ type: 'SET_CONVERSATIONS', payload: JSON.parse(storedConversations) });
      } else {
        dispatch({ type: 'SET_CONVERSATIONS', payload: [] });
      }
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' });
  }
};
*/ 

// Send a message to the AI and get a response
const sendMessage = dispatch => async (message, conversationId = null) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Message is required');
    }
    
    // Create user message object
    const userMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Add user message to state
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    
    try {
      // Send message to backend API
      const response = await api.post('assistant/chat', { 
        message: message.trim(),
        conversationId
      });
      
      // Create AI response message
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Add AI response to state
      dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
      
      // If this is a new conversation, update the conversation ID
      if (!conversationId && response.data.conversationId) {
        dispatch({ 
          type: 'SET_CURRENT_CONVERSATION', 
          payload: {
            id: response.data.conversationId,
            messages: [userMessage, aiMessage]
          }
        });
      }
      
      return { success: true, aiResponse: response.data.response };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      
      // Add error message
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
      throw new Error(error.response?.data?.error || 'Failed to get AI response');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    dispatch({ type: 'SET_ERROR', payload: error.message });
    return { success: false, error: error.message };
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

// Start a new conversation
const startNewConversation = dispatch => () => {
  dispatch({ 
    type: 'SET_CURRENT_CONVERSATION', 
    payload: {
      id: null,
      messages: [{
        id: '1',
        text: 'Hi there! I\'m your AI bestie. I can help you with questions about scoliosis, treatment options, and living with a brace. What would you like to know?',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]
    }
  });
};

// Load a specific conversation
const loadConversation = dispatch => async (conversationId) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Get conversation from backend
    const response = await api.get(`assistant/conversations/${conversationId}`);
    
    if (response.data.conversation) {
      dispatch({ type: 'SET_CURRENT_CONVERSATION', payload: response.data.conversation });
      return { success: true };
    } else {
      throw new Error('Conversation not found');
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversation' });
    return { success: false, error: error.message };
  } finally {
    dispatch({ type: 'SET_LOADING', payload: false });
  }
};

// Clear any errors
const clearError = dispatch => () => {
  dispatch({ type: 'SET_ERROR', payload: null });
};

// Export the context and provider
export const { Context, Provider } = createDataContext(
  assistantReducer,
  {
    sendMessage,
    startNewConversation,
    loadConversation,
    clearError
  },
  {
    conversations: [],
    currentConversation: {
      id: null,
      messages: [{
        id: '1',
        text: 'Hi there! I\'m your AI bestie. I can help you with questions about scoliosis, treatment options, and living with a brace. What would you like to know?',
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]
    },
    loading: false,
    error: null
  }
);
