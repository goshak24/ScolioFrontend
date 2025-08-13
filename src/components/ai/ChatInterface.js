import React, { useState, useRef, useEffect, useContext, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Platform, SafeAreaView, Keyboard, StatusBar, KeyboardAvoidingView } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import ChatMessage from './ChatMessage';
import { formatMessageDayLabel } from '../messaging/chat/utils';
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
    loadConversation,
    clearCurrentConversation
  } = useContext(AssistantContext);
  
  const [inputMessage, setInputMessage] = useState('');
  const [initialQuestionSent, setInitialQuestionSent] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const flatListRef = useRef(null);
  const keyboardListeners = useRef([]);

  // Memoized handlers to prevent re-renders
  const handleSendMessage = useCallback(async (manualQuestion = null) => {
    const textToSend = manualQuestion || inputMessage;
    
    if (!textToSend.trim()) return;
    
    setInputMessage('');
    
    // Use the context function to send the message
    await sendMessage(textToSend, currentConversation?.id);
  }, [inputMessage, sendMessage, currentConversation?.id]);

  // Initialize conversation only once when component becomes visible
  useEffect(() => {
    if (isVisible && !isInitialized) {
      setIsInitialized(true);
      setInitialQuestionSent(false);
      
      if (conversationId) {
        // Load existing conversation if ID is provided
        loadConversation(conversationId);
      } else {
        // Start a new conversation
        startNewConversation();
      }
    } else if (!isVisible && isInitialized) {
      // Reset when closing
      setIsInitialized(false);
      setInitialQuestionSent(false);
      setInputMessage('');
      clearCurrentConversation();
    }
  }, [isVisible, conversationId, isInitialized, loadConversation, startNewConversation, clearCurrentConversation]);

  // Handle keyboard listeners with proper cleanup
  useEffect(() => {
    if (isVisible) {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => setKeyboardVisible(true)
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => setKeyboardVisible(false)
      );

      keyboardListeners.current = [keyboardDidShowListener, keyboardDidHideListener];

      return () => {
        keyboardListeners.current.forEach(listener => listener.remove());
        keyboardListeners.current = [];
      };
    }
  }, [isVisible]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (flatListRef.current && currentConversation?.messages?.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [currentConversation?.messages?.length]);
  
  // Handle pre-filled question - only once per conversation
  useEffect(() => {
    if (initialQuestion && !initialQuestionSent && isVisible && isInitialized && currentConversation) {
      setInputMessage(initialQuestion);
      setInitialQuestionSent(true);
      
      // Automatically send the message after a short delay
      const timer = setTimeout(() => {
        handleSendMessage(initialQuestion);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [initialQuestion, initialQuestionSent, isVisible, isInitialized, currentConversation, handleSendMessage]);

  // Don't render if not visible
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
              data={(() => {
                const msgs = currentConversation?.messages || [];
                const result = [];
                let prevKey = null;
                for (let i = 0; i < msgs.length; i += 1) {
                  const m = msgs[i];
                  const label = formatMessageDayLabel(m.timestamp);
                  if (label && label !== prevKey) {
                    result.push({ type: 'separator', key: `sep-${label}-${i}`, label });
                    prevKey = label;
                  }
                  result.push({ type: 'message', key: m.id || `m-${i}`, data: m });
                }
                return result;
              })()}
              keyExtractor={(item, index) => item.key || index.toString()}
              renderItem={({ item }) => (
                item.type === 'separator' ? (
                  <View style={styles.separatorContainer}>
                    <View style={styles.separatorLine} />
                    <View style={styles.separatorLabelContainer}>
                      <Text style={styles.separatorLabelText}>{item.label}</Text>
                    </View>
                    <View style={styles.separatorLine} />
                  </View>
                ) : (
                  <ChatMessage 
                    text={item.data.text}
                    isUser={item.data.isUser}
                    timestamp={item.data.timestamp}
                  />
                )
              )}
              style={styles.messagesList}
              contentContainerStyle={[
                styles.messagesContent,
                keyboardVisible && Platform.OS === 'ios' ? { paddingBottom: verticalScale(60) } : null
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={10}
              getItemLayout={(data, index) => (
                {length: 60, offset: 60 * index, index} // Approximate item height
              )}
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
            handleSend={handleSendMessage}
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
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
    paddingHorizontal: moderateScale(10),
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  separatorLabelContainer: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    marginHorizontal: moderateScale(8),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
  },
  separatorLabelText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  loadingText: {
    color: COLORS.lightGray,
    marginLeft: moderateScale(8),
    fontSize: moderateScale(12),
  },
});

export default ChatInterface; 