import React, { useEffect, useState, useContext, useRef, useMemo } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS';
import { Context as MessagesContext } from '../context/MessagesContext';
import { Context as UserContext } from '../context/UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import modular components
import {
    ChatHeader,
    ChatInput,
    MessageList,
    LoadingState,
    formatMessageTime
} from '../components/messaging/chat';

const ChatScreen = ({ route, navigation }) => {
    const { otherUser } = route.params;
    const { state: messagesState, getMessages, sendMessage, clearCurrentConversation, setupMessageListener, getOlderMessages, markMessagesAsRead } = useContext(MessagesContext);
    const { state: userState } = useContext(UserContext);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const flatListRef = useRef(null);
    const prevMessageCount = useRef(0);
    const lastMessageUpdate = useRef(Date.now());
    
    // Memoize the messages array to prevent unnecessary re-renders
    const messages = useMemo(() => {
        console.log(`🔄 Memoizing messages array with ${messagesState.messages.length} messages`);
        return messagesState.messages || [];
    }, [messagesState.messages]);
    
    // Log state changes to help debug
    useEffect(() => {
        console.log(`📊 MessagesState updated - messages: ${messagesState.messages.length}, loading: ${messagesState.loading}, error: ${messagesState.error ? 'yes' : 'no'}`);
    }, [messagesState]);
    

    // Fetch messages and setup listener on mount
    useEffect(() => {
        let isActive = true; // Track if component is active to prevent state updates after unmount
        
        const initializeChat = async () => {
            if (!isActive) return; // Don't continue if component is unmounting
            
            setLoading(true);
            setError(null);
            try {
                // Make sure we have a valid user
                if (!userState?.user?.uid) {
                    setError("User authentication required. Please sign in again.");
                    setLoading(false);
                    return;
                }

                console.log(`🔐 ChatScreen initializing with user 1 and other user`);
                
                // Store userId in AsyncStorage for future reference
                try {
                    await AsyncStorage.setItem('userId', userState.user.uid);
                } catch (err) {
                    console.error("Error storing userId in AsyncStorage:", err);
                    // Continue anyway - we have the ID in memory
                }
                
                // Load initial messages (from cache or API) and setup Firebase listener
                console.log('📥 Loading initial messages and setting up Firebase listener');
                await getMessages(otherUser.id, false, 0, 20, userState.user.uid);
                
                // getMessages internally sets up the Firebase listener
                // The listener cleanup is handled by the MessagesContext
                
                // Create conversationId manually  
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                
                // Mark messages as read when opening the conversation
                if (isActive && markMessagesAsRead) {
                    console.log('📖 Marking messages as read for conversation');
                    markMessagesAsRead(conversationId, userState.user.uid);
                }
            } catch (error) {
                console.error("❌ Error initializing chat:", error);
                if (isActive) {
                    setError(error.message || "Failed to load conversation");
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                    console.log('📱 ChatScreen initialization complete');
                }
            }
        };

        // Set up focus handler to refresh messages when returning to the screen
        const refreshOnFocus = () => {
            console.log("🔍 Screen focused - marking messages as read");
            if (userState?.user?.uid && otherUser?.id) {
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                
                // Mark messages as read when returning to the conversation
                // The Firebase listener is already active from initial setup
                if (markMessagesAsRead) {
                    console.log('📖 Marking messages as read on focus');
                    markMessagesAsRead(conversationId, userState.user.uid);
                }
            }
        };

        initializeChat();
        
        // Add focus listener
        const unsubscribeFocus = navigation.addListener('focus', refreshOnFocus);

        // Cleanup when unmounting
        return () => {
            isActive = false; // Mark as inactive first
            console.log("🧹 ChatScreen unmounting, cleaning up listeners");
            
            // Remove focus listener
            unsubscribeFocus();
            
            // Clear current conversation - this will cleanup Firebase listeners in MessagesContext
            clearCurrentConversation();
        };
    }, [otherUser.id, userState.user?.uid]);

    // Scroll to bottom when messages change, but only when loading is complete
    useEffect(() => {
        // Don't scroll while initial loading or loading older messages
        if (loading || messagesState.loadingOlderMessages) {
            console.log("⏳ Skip auto-scroll during loading");
            return;
        }
        
        // Only auto-scroll when a new message arrives
        if (flatListRef.current && messages.length > 0) {
            // Check if message count has increased - we have a new message
            if (messages.length > prevMessageCount.current) {
                console.log(`📜 Auto-scrolling to bottom - messages increased from ${prevMessageCount.current} to ${messages.length}`);
                
                // Add a small delay to ensure render is complete
                const scrollTimer = setTimeout(() => {
                    if (flatListRef.current) {
                        flatListRef.current.scrollToEnd({ animated: true });
                        console.log("📜 Scrolled to end");
                    }
                }, 100);
                
                // Track the last time we updated to help debug
                lastMessageUpdate.current = Date.now();
                
                // Clean up timer
                return () => clearTimeout(scrollTimer);
            } else {
                console.log(`📚 No auto-scroll needed - message count unchanged at ${messages.length}`);
            }
            
            // Update the previous count
            prevMessageCount.current = messages.length;
        }
    }, [messages.length, loading, messagesState.loadingOlderMessages]);

    // Monitor message changes 
    useEffect(() => {
        if (messages.length > 0) {
            console.log(`💬 Messages updated: ${messages.length} messages available, last update: ${new Date(lastMessageUpdate.current).toISOString()}`);
            
            // Mark messages as read when new messages arrive and user is viewing the conversation
            if (messages.length > prevMessageCount.current && markMessagesAsRead && userState?.user?.uid) {
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                console.log('📖 Marking new messages as read');
                markMessagesAsRead(conversationId, userState.user.uid);
            }
            
            // Track previous count for next comparison
            prevMessageCount.current = messages.length;
            
            // Force a render by updating the last message time
            lastMessageUpdate.current = Date.now();
        }
    }, [messages.length, markMessagesAsRead, userState?.user?.uid, otherUser.id]);

    // Handle loading more messages when user scrolls to top
    const handleLoadMore = async () => {
        if (messagesState.loadingOlderMessages || !messagesState.hasMoreMessages) {
            return;
        }
        
        try {
            // Make sure we have a valid user ID
            if (!userState?.user?.uid) {
                throw new Error("User authentication required to load messages");
            }
            
            await getOlderMessages(otherUser.id, userState.user.uid);
        } catch (error) {
            console.error("Error loading more messages:", error);
            setError(error.message || "Failed to load older messages");
        }
    };

    // We're now using the formatMessageTime utility function imported from '../components/ai/chat'

    // Handle sending a new message
    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        
        const trimmedMessage = messageText.trim();
        setMessageText('');
        
        try {
            // Pass the user ID from context
            if (!userState?.user?.uid) {
                throw new Error("User authentication required to send messages");
            }
            
            // Optimistically scroll to bottom immediately (feels more responsive)
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: false });
                }
            }, 10);
            
            // Send the message
            await sendMessage(otherUser.id, trimmedMessage, userState.user.uid);
            
            // Firebase listener will handle the update, but we'll scroll again after a delay
            // just to ensure the new message is visible
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 300);
        } catch (error) {
            console.error("Error sending message:", error);
            setError(error.message || "Failed to send message");
        }
    };

    // Handle content size change for scrolling
    const handleContentSizeChange = () => {
        // Scroll to bottom when content size changes (only if not loading older messages)
        if (flatListRef.current && messages.length > 0 && !messagesState.loadingOlderMessages) {
            requestAnimationFrame(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: false });
                    console.log("📜 Scrolled to end on content size change");
                }
            });
        }
    };
    
    // Handle layout change for scrolling
    const handleLayout = () => {
        // Scroll to bottom when layout changes
        if (flatListRef.current && messages.length > 0 && !messagesState.loadingOlderMessages) {
            requestAnimationFrame(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: false });
                    console.log("📜 Scrolled to end on layout change");
                }
            });
        }
    };

    // Handle retry/go back when error occurs
    const handleRetry = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Chat header */}
            <ChatHeader 
                otherUser={otherUser} 
                onBackPress={() => navigation.goBack()} 
                onUserPress={() => {
                    // Navigate to user profile if needed
                }} 
            />

            {/* Messages content */}
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 5}
            >
                <LoadingState 
                    loading={loading} 
                    error={error} 
                    onRetry={handleRetry} 
                />
                
                {!loading && !error && (
                    <View style={styles.messagesContainer}>
                        <View style={styles.messageListWrapper}>
                            <MessageList 
                                ref={flatListRef}
                                messages={messages}
                                loadingMore={messagesState.loadingOlderMessages}
                                hasMoreMessages={messagesState.hasMoreMessages}
                                onLoadMore={handleLoadMore}
                                formatMessageTime={formatMessageTime}
                                userId={userState?.user?.uid}
                                lastUpdate={lastMessageUpdate.current}
                                onContentSizeChange={handleContentSizeChange}
                                onLayout={handleLayout}
                            />
                        </View>

                        {/* Message input */}
                        <ChatInput 
                            messageText={messageText} 
                            onChangeText={setMessageText} 
                            onSendPress={handleSendMessage} 
                        />
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
    },
    messageListWrapper: {
        flex: 1,
        backgroundColor: COLORS.darkBackground,
    }
});

export default ChatScreen;