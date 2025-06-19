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
    case 'UPDATE_CONVERSATION_MESSAGES':
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          messages: action.payload
        },
        error: null
      };
    case 'ADD_MESSAGE_TO_CURRENT_CONVERSATION':
      return {
        ...state,
        currentConversation: {
          ...state.currentConversation,
          messages: [...(state.currentConversation?.messages || []), action.payload]
        },
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_CURRENT_CONVERSATION':
      return { ...state, currentConversation: null };
    default:
      return state;
  }
};

// Load conversation list (summaries only)
const loadConversations = dispatch => async () => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const response = await api.get('assistant/conversations');
    dispatch({ type: 'SET_CONVERSATIONS', payload: response.data.conversations || [] });
  } catch (error) {
    console.error('Error loading conversations:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to load conversations' });
  }
};

// Send a message to the AI and get a response
const sendMessage = dispatch => async (message, conversationId = null) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Validate message
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new Error('Message is required');
    }
    
    // Create user message object for immediate UI update
    const userMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      isUser: true,
      timestamp: new Date().toISOString()
    };
    
    // Update UI immediately with user message
    dispatch({ 
      type: 'ADD_MESSAGE_TO_CURRENT_CONVERSATION', 
      payload: userMessage
    });
    
    try {
      // Send message to backend API
      const response = await api.post('assistant/chat', { 
        message: message.trim(),
        conversationId
      });
      
      // Update with the full conversation from backend
      if (response.data.conversation) {
        dispatch({ 
          type: 'SET_CURRENT_CONVERSATION', 
          payload: response.data.conversation
        });
      }
      
      return { success: true, aiResponse: response.data.response };
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      
      // Add error message to UI
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        isUser: false,
        timestamp: new Date().toISOString()
      };
      
      dispatch({ 
        type: 'ADD_MESSAGE_TO_CURRENT_CONVERSATION', 
        payload: errorMessage
      });
      
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
        timestamp: new Date().toISOString()
      }]
    }
  });
};

// Load a specific conversation with full message history
const loadConversation = dispatch => async (conversationId) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Get full conversation from backend
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

// Clear current conversation
const clearCurrentConversation = dispatch => () => {
  dispatch({ type: 'CLEAR_CURRENT_CONVERSATION' });
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
    loadConversations,
    clearCurrentConversation,
    clearError
  },
  {
    conversations: [],
    currentConversation: null,
    loading: false,
    error: null
  }
);