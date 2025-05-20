import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, SafeAreaView, Keyboard, StatusBar, KeyboardAvoidingView } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import Constants from 'expo-constants';
import { Context as AssistantContext } from '../../context/AssistantContext';

/**
 * ChatInterface component for AI chat interactions
 * @param {function} onClose - Function to close the chat interface
 * @param {boolean} isVisible - Whether the chat interface is visible
 * @param {string} initialQuestion - Pre-filled question (optional)
 * @param {string} conversationId - ID of an existing conversation to load (optional)
 */
const ChatInterface = ({ onClose, isVisible, initialQuestion = null, conversationId = null }) => {
  const { 
    state: { currentConversation, loading }, 
    sendMessage, 
    startNewConversation,
    loadConversation
  } = useContext(AssistantContext);
  
  const [inputMessage, setInputMessage] = useState('');
  const [initialQuestionSent, setInitialQuestionSent] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const flatListRef = useRef(null);

  // Initialize the conversation when component mounts
  useEffect(() => {
    if (isVisible) {
      if (conversationId) {
        // Load existing conversation if ID is provided
        loadConversation(conversationId);
      } else {
        // Start a new conversation
        startNewConversation();
      }
    }
  }, [isVisible, conversationId]);

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
    if (flatListRef.current && currentConversation?.messages?.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentConversation?.messages]);
  
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

  const handleSendMessage = async (manualQuestion = null) => {
    const textToSend = manualQuestion || inputMessage;
    
    if (!textToSend.trim()) return;
    
    setInputMessage('');
    
    // Use the context function to send the message
    await sendMessage(textToSend, currentConversation?.id);
  };

  if (!isVisible) return null;

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.cardDark}
        translucent={false}
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        enabled
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
              data={currentConversation?.messages || []}
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
            
            {loading && (
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
            isLoading={loading}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
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