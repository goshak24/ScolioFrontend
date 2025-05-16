import React, { useState, useRef, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, SafeAreaView, Keyboard, StatusBar } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Constants from 'expo-constants';
import KeyboardAvoidingWrapper from '../reusable/KeyboardAvoidingWrapper';

/**
 * ChatInterface component for AI chat interactions
 * @param {function} onClose - Function to close the chat interface
 * @param {boolean} isVisible - Whether the chat interface is visible
 * @param {string} initialQuestion - Pre-filled question (optional)
 */
const ChatInterface = ({ onClose, isVisible, initialQuestion = null }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi there! I\'m your AI bestie. I can help you with questions about scoliosis, treatment options, and living with a brace. What would you like to know?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialQuestionSent, setInitialQuestionSent] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const flatListRef = useRef(null);

  // Handle keyboard appearance
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  // Handle pre-filled question if provided
  useEffect(() => {
    if (initialQuestion && !initialQuestionSent && isVisible) {
      setInputMessage(initialQuestion);
      setInitialQuestionSent(true);
      
      // Automatically send the message after a short delay
      const timer = setTimeout(() => {
        handleSendMessage(initialQuestion);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialQuestion, initialQuestionSent, isVisible]);

  // Mock function to get AI response - replace with real API call
  const getAIResponse = async (userMessage) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: Replace with actual API call to your backend
    return {
      text: `I understand your question about "${userMessage}". This is where I would provide a helpful answer about scoliosis. For now, I'm just a placeholder response.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleSendMessage = async (manualQuestion = null) => {
    const textToSend = manualQuestion || inputMessage;
    
    if (!textToSend.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const aiResponse = await getAIResponse(userMessage.text);
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        isUser: false,
        timestamp: aiResponse.timestamp
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I encountered an error processing your request. Please try again.',
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.cardDark}
        translucent={false}
      />
      <KeyboardAvoidingWrapper 
        withScrollView={false} 
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Chat with AI Bestie</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={moderateScale(24)} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ChatMessage 
                  text={item.text}
                  isUser={item.isUser}
                  timestamp={item.timestamp}
                />
              )}
              style={styles.messagesList}
              contentContainerStyle={[
                styles.messagesContent,
                keyboardVisible && Platform.OS === 'ios' ? { paddingBottom: verticalScale(60) } : null
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              removeClippedSubviews={false}
            />
            
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.gradientPink} />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </View>
          
          <ChatInput 
            message={inputMessage}
            setMessage={setInputMessage}
            handleSend={() => handleSendMessage()}
            isLoading={isLoading}
          />
        </SafeAreaView>
      </KeyboardAvoidingWrapper>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(15),
    backgroundColor: COLORS.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10), 
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    position: 'absolute',
    right: moderateScale(15),
    top: Platform.OS === 'android' ? (Constants.statusBarHeight + moderateScale(10) || 30) : moderateScale(10),
  },
  chatContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(2),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    backgroundColor: COLORS.darkBackground,
  },
  loadingText: {
    color: COLORS.lightGray,
    marginLeft: moderateScale(8),
    fontSize: moderateScale(12),
  },
});

export default ChatInterface; 