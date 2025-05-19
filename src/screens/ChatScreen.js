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
} from '../components/ai/chat';

const ChatScreen = ({ route, navigation }) => {
    const { otherUser } = route.params;
    const { state: messagesState, getMessages, sendMessage, clearCurrentConversation, setupMessageListener, getOlderMessages } = useContext(MessagesContext);
    const { state: userState } = useContext(UserContext);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const flatListRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const prevMessageCount = useRef(0);
    const lastMessageUpdate = useRef(Date.now());
    const pollTimerRef = useRef(null);
    
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
                
                // Get initial messages
                if (isActive) {
                    console.log('💬 Initial messages loaded');
                }
                
                // Create conversationId manually
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                
                // Setup listener with explicit user IDs (if active)
                if (isActive) {
                    console.log(`📡 Setting up immediate listener for user 1 and other user`);
                    
                    // Setup listener with explicit user IDs
                    const unsubscribe = setupMessageListener(
                        conversationId,
                        userState.user.uid
                    );
                    
                    // Save unsubscribe function for cleanup
                    if (typeof unsubscribe === 'function') {
                        unsubscribeRef.current = unsubscribe;
                        console.log('📲 Message listener setup complete');
                    }
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
            console.log("🔍 Screen focused - refreshing messages");
            if (userState?.user?.uid && otherUser?.id) {
                // Force a refresh when returning to the screen
                getMessages(otherUser.id, true, 0, 20, userState.user.uid);
                
                // Re-establish the listener
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                
                // First clean up any existing listener
                if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
                
                console.log(`🔄 Setting up fresh listener on focus for users 1 and other user`);
                
                // Setup fresh listener with both user IDs explicitly passed
                const unsubscribe = setupMessageListener(
                    conversationId,
                    userState.user.uid
                );
                
                // Save unsubscribe function for cleanup
                if (typeof unsubscribe === 'function') {
                    unsubscribeRef.current = unsubscribe;
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
            
            // Clean up polling if active
            if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
            }
            
            // First try to use the stored unsubscribe function
            if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                console.log("🗑️ Calling stored unsubscribe function");
                try {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null; // Clear the ref after unsubscribing
                } catch (err) {
                    console.error("❌ Error calling unsubscribe function:", err);
                }
            }
            
            // Remove focus listener
            unsubscribeFocus();
            
            // Then call clearCurrentConversation to ensure proper cleanup
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
            
            // Track previous count for next comparison
            prevMessageCount.current = messages.length;
            
            // Force a render by updating the last message time
            lastMessageUpdate.current = Date.now();
        }
    }, [messages.length]);

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
    }
});

export default ChatScreen;