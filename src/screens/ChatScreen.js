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

                console.log(`🔐 ChatScreen initializing with user and other user`);
                
                // Store userId in AsyncStorage for future reference
                try {
                    await AsyncStorage.setItem('userId', userState.user.uid);
                } catch (err) {
                    console.error("Error storing userId in AsyncStorage:", err);
                    // Continue anyway - we have the ID in memory
                }
                
                // Load initial messages ONCE (cached for 48 hours, Firebase handles new ones)
                await getMessages(otherUser.id, false, 0, 10, userState.user.uid);
                
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

    // Handle message updates and scrolling (WhatsApp-style)
    useEffect(() => {
        if (loading) {
            return; // Don't process during initial loading
        }
        
        const currentMessageCount = messages.length;
        const hadNewMessage = currentMessageCount > prevMessageCount.current;
        
        // Update previous count
        prevMessageCount.current = currentMessageCount;
        
        // Handle new messages - auto-scroll to bottom for new messages only
        if (hadNewMessage && flatListRef.current && currentMessageCount > 0 && !messagesState.loadingOlderMessages) {
            // Mark messages as read for new messages
            if (markMessagesAsRead && userState?.user?.uid) {
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                markMessagesAsRead(conversationId, userState.user.uid);
            }
            
            // Scroll to bottom for new messages
            requestAnimationFrame(() => {
                if (flatListRef.current && !messagesState.loadingOlderMessages) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            });
        }
    }, [messages.length, loading, messagesState.loadingOlderMessages, markMessagesAsRead, userState?.user?.uid, otherUser.id]);

    // Handle loading more messages when user pulls to refresh (scrolls to top)
    const handleLoadMore = async () => {
        if (messagesState.loadingOlderMessages || !messagesState.hasMoreMessages || loading) {
            console.log(`⏭️ Skipping load more: loading=${messagesState.loadingOlderMessages}, hasMore=${messagesState.hasMoreMessages}, initialLoading=${loading}`);
            return;
        }
        
        try {
            // Make sure we have a valid user ID
            if (!userState?.user?.uid) {
                throw new Error("User authentication required to load messages");
            }
            
            console.log(`📤 Loading older messages for conversation with ${otherUser.username || otherUser.id}`);
            await getOlderMessages(otherUser.id, userState.user.uid);
            
        } catch (error) {
            console.error("❌ Error loading more messages:", error);
            setError(error.message || "Failed to load older messages");
        }
    };

    // Handle sending a new message (WhatsApp-style)
    const handleSendMessage = async () => {
        if (!messageText.trim()) return;
        
        const trimmedMessage = messageText.trim();
        setMessageText('');
        
        try {
            // Pass the user ID from context
            if (!userState?.user?.uid) {
                throw new Error("User authentication required to send messages");
            }
            
            // Send the message - the useEffect will handle scrolling to show the new message
            await sendMessage(otherUser.id, trimmedMessage, userState.user.uid);
            
        } catch (error) {
            console.error("Error sending message:", error);
            setError(error.message || "Failed to send message");
        }
    };

    // Content size change handler
    const handleContentSizeChange = (contentWidth, contentHeight) => {
        // Auto-scroll to bottom on initial load
        if (messages.length > 0 && flatListRef.current && !messagesState.loadingOlderMessages) {
            setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: false });
                }
            }, 100);
        }
    };
    
    // Layout handler
    const handleLayout = (event) => {
        // Handle layout changes if needed
        const { height } = event.nativeEvent.layout;
        console.log(`📐 MessageList layout height: ${height}`);
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