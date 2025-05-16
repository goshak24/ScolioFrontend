import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    Image,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../constants/COLORS';
import { Context as MessagesContext } from '../context/MessagesContext';
import { Context as UserContext } from '../context/UserContext';
import { format } from 'date-fns';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = ({ route, navigation }) => {
    const { otherUser } = route.params;
    const { state: messagesState, getMessages, sendMessage, clearCurrentConversation, setupMessageListener, getOlderMessages } = useContext(MessagesContext);
    const { state: userState } = useContext(UserContext);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const [messageVersion, setMessageVersion] = useState(0); // Add a state to track message changes
    const flatListRef = useRef(null);
    const unsubscribeRef = useRef(null);
    const prevMessageCount = useRef(0);
    const pollingIntervalRef = useRef(null);

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

                // Store userId in AsyncStorage for future reference
                try {
                    await AsyncStorage.setItem('userId', userState.user.uid);
                } catch (err) {
                    console.error("Error storing userId in AsyncStorage:", err);
                    // Continue anyway - we have the ID in memory
                }
                
                // Get initial messages
                if (isActive) {
                    await getMessages(otherUser.id, false, 0, undefined, userState.user.uid);
                }
                
                // IMMEDIATELY setup the listener BEFORE waiting for API response
                // This ensures we catch any real-time updates that happen while loading
                if (isActive) {
                    console.log(`Setting up immediate listener for user ${userState.user.uid} and other user ${otherUser.id}`);
                    
                    // Create conversationId manually - this is just for tracking, actual security is user ID based
                    const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                    
                    // Setup listener with explicit user IDs
                    const unsubscribe = setupMessageListener(
                        conversationId,
                        userState.user.uid
                    );
                    
                    // Save unsubscribe function for cleanup
                    if (typeof unsubscribe === 'function') {
                        unsubscribeRef.current = unsubscribe;
                    }
                    
                    // Setup a polling interval to force UI updates
                    startMessagePolling();
                }
            } catch (error) {
                console.error("Error initializing chat:", error);
                if (isActive) {
                    setError(error.message || "Failed to load conversation");
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        // Set up focus handler to refresh messages when returning to the screen
        const refreshOnFocus = () => {
            console.log("Screen focused - refreshing messages");
            if (userState?.user?.uid && otherUser?.id) {
                // Force a refresh when returning to the screen
                getMessages(otherUser.id, true, 0, undefined, userState.user.uid);
                
                // Re-establish the listener
                const conversationId = [userState.user.uid, otherUser.id].sort().join('_');
                
                // First clean up any existing listener
                if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }
                
                console.log(`Setting up fresh listener on focus for users ${userState.user.uid} and ${otherUser.id}`);
                
                // Setup fresh listener with both user IDs explicitly passed
                const unsubscribe = setupMessageListener(
                    conversationId,
                    userState.user.uid
                );
                
                // Save unsubscribe function for cleanup
                if (typeof unsubscribe === 'function') {
                    unsubscribeRef.current = unsubscribe;
                }
                
                // Restart the polling interval
                startMessagePolling();
            }
        };

        // Start UI update polling interval
        const startMessagePolling = () => {
            // Clear any existing interval
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
            
            // Create a new interval to check for message updates
            pollingIntervalRef.current = setInterval(() => {
                if (isActive) {
                    // Force a re-render to check for new messages
                    setMessageVersion(prev => prev + 1);
                }
            }, 1000); // Check every second
        };

        initializeChat();
        
        // Add focus listener
        const unsubscribeFocus = navigation.addListener('focus', refreshOnFocus);

        // Cleanup when unmounting
        return () => {
            isActive = false; // Mark as inactive first
            console.log("ChatScreen unmounting, cleaning up listeners");
            
            // Clear polling interval
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
            
            // First try to use the stored unsubscribe function
            if (unsubscribeRef.current && typeof unsubscribeRef.current === 'function') {
                console.log("Calling stored unsubscribe function");
                try {
                    unsubscribeRef.current();
                    unsubscribeRef.current = null; // Clear the ref after unsubscribing
                } catch (err) {
                    console.error("Error calling unsubscribe function:", err);
                }
            }
            
            // Remove focus listener
            unsubscribeFocus();
            
            // Then call clearCurrentConversation to ensure proper cleanup
            clearCurrentConversation();
        };
    }, [otherUser.id, userState.user?.uid]); // Removed messagesState.currentConversation from dependencies

    // Scroll to bottom when messages change, but only when loading is complete
    useEffect(() => {
        // Don't scroll while initial loading or loading older messages
        if (loading || messagesState.loadingOlderMessages) return;
        
        // Only auto-scroll when a new message arrives
        if (flatListRef.current && messagesState.messages.length > 0) {
            // Add a small delay to ensure render is complete
            const scrollTimer = setTimeout(() => {
                if (flatListRef.current) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 100);
            
            // Clean up timer
            return () => clearTimeout(scrollTimer);
        }
    }, [messagesState.messages.length, loading, messagesState.loadingOlderMessages, messageVersion]); // Added messageVersion to dependencies

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

    // Format message timestamp
    const formatMessageTime = (timestamp) => {
        if (!timestamp) {
            return '';
        }
        
        try {
            let date;
            
            // Handle different timestamp formats
            if (timestamp._seconds) {
                // Firestore timestamp
                date = new Date(timestamp._seconds * 1000);
            } else if (timestamp.seconds) {
                // Alternative Firestore timestamp format
                date = new Date(timestamp.seconds * 1000);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                // Handle ISO string format
                date = new Date(timestamp);
            } else {
                // Default to current time if we can't determine format
                return format(new Date(), 'h:mm a');
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                // Default to current time if date is invalid
                return format(new Date(), 'h:mm a');
            }
            
            return format(date, 'h:mm a');
        } catch (error) {
            // Default to current time on error
            return format(new Date(), 'h:mm a');
        }
    };

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
            
            // Force a re-render to update the UI immediately
            setMessageVersion(prev => prev + 1);
            
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

    // Render message item
    const renderMessageItem = useCallback(({ item }) => {
        // Correct ownership check - check against user's UID with null safety
        const isOwnMessage = item.senderId === userState?.user?.uid;
        
        return (
            <View style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
            ]}>
                {isOwnMessage ? (
                    // Own message with gradient background
                    <LinearGradient
                        colors={[COLORS.gradientPurple, COLORS.gradientPink]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ownMessage}
                    >
                        <Text style={styles.messageText}>{item.content}</Text>
                        <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
                        {item.status === 'sending' && (
                            <View style={styles.statusIndicator}>
                                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
                            </View>
                        )}
                        {item.status === 'failed' && (
                            <View style={styles.failedIndicator}>
                                <Ionicons name="warning-outline" size={10} color="#ff5c5c" />
                            </View>
                        )}
                    </LinearGradient>
                ) : (
                    // Other user's message
                    <View style={styles.otherMessage}>
                        <Text style={styles.messageText}>{item.content}</Text>
                        <Text style={styles.messageTime}>{formatMessageTime(item.timestamp)}</Text>
                    </View>
                )}
            </View>
        );
    }, [userState?.user?.uid]);

    // Render loading indicator for pagination
    const renderLoadingMoreIndicator = () => {
        if (messagesState.loadingOlderMessages && messagesState.hasMoreMessages) {
            return (
                <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={COLORS.gradientPink} />
                </View>
            );
        }
        
        return null;
    };

    // Monitor message changes 
    useEffect(() => {
        if (messagesState.messages.length > 0) {
            console.log(`💬 Messages updated: ${messagesState.messages.length} messages available`);
            
            // Refresh the conversation if going from 0 to having messages
            if (prevMessageCount.current === 0 && messagesState.messages.length > 0) {
                console.log('First messages received, ensuring proper setup');
                
                // If we have a current conversation, make sure the listener is active
                if (messagesState.currentConversation?.id && userState?.user?.uid) {
                    console.log(`Re-establishing listener for conversation ${messagesState.currentConversation.id}`);
                    const unsubscribe = setupMessageListener(
                        messagesState.currentConversation.id,
                        userState.user.uid
                    );
                    
                    // Save unsubscribe function for cleanup
                    if (typeof unsubscribe === 'function') {
                        unsubscribeRef.current = unsubscribe;
                    }
                }
            }
            
            // Track previous count for next comparison
            prevMessageCount.current = messagesState.messages.length;
            
            // Force a messageVersion update to ensure UI re-renders
            setMessageVersion(prev => prev + 1);
        }
    }, [messagesState.messages.length, messagesState.currentConversation?.id, userState?.user?.uid]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Chat header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color={COLORS.white} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.userInfo}
                    onPress={() => {
                        // Navigate to user profile if needed
                    }}
                >
                    <Image
                        source={{ uri: otherUser.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                        style={styles.avatar}
                    />
                    <View style={styles.userTextInfo}>
                        <Text style={styles.username}>{otherUser.username || 'Unknown User'}</Text>
                        <Text style={styles.userStatus}>
                            {otherUser.isOnline ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </TouchableOpacity>
                
                <View style={styles.placeholderView} />
            </View>

            {/* Messages content */}
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 5}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.gradientPink} />
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={COLORS.gradientPink} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.retryButtonText}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.messagesContainer}>
                        <FlatList
                            overScrollMode="never"
                            bounces={true}
                            showsVerticalScrollIndicator={false}
                            ref={flatListRef}
                            data={messagesState.messages}
                            extraData={[messageVersion, messagesState.messages.map(m => m.status).join(',')]} 
                            keyExtractor={(item, index) => item.id ? String(item.id) : `msg-${index}-${Date.now()}`}
                            renderItem={renderMessageItem}
                            contentContainerStyle={styles.messagesContent}
                            ListHeaderComponent={renderLoadingMoreIndicator}
                            ListEmptyComponent={
                                <View style={styles.emptyMessages}>
                                    <Text style={styles.emptyText}>No messages yet</Text>
                                    <Text style={styles.emptySubtext}>Start a conversation!</Text>
                                </View>
                            }
                            onEndReachedThreshold={0.1}
                            onEndReached={() => {
                                if (!messagesState.loadingOlderMessages && flatListRef.current && messagesState.messages.length > 0) {
                                    requestAnimationFrame(() => {
                                        if (flatListRef.current) {
                                            flatListRef.current.scrollToEnd({ animated: false });
                                        }
                                    });
                                }
                            }}
                            onContentSizeChange={() => {
                                if (flatListRef.current && messagesState.messages.length > 0 && !messagesState.loadingOlderMessages) {
                                    requestAnimationFrame(() => {
                                        if (flatListRef.current) {
                                            flatListRef.current.scrollToEnd({ animated: false });
                                        }
                                    });
                                }
                            }}
                            onLayout={() => {}}
                            onRefresh={handleLoadMore}
                            refreshing={messagesState.loadingOlderMessages}
                            removeClippedSubviews={false}
                            maxToRenderPerBatch={10}
                            windowSize={10}
                            initialNumToRender={15}
                        />

                        {/* Message input */}
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.messageInput}
                                placeholder="Type a message..."
                                placeholderTextColor={COLORS.lightGray}
                                value={messageText}
                                onChangeText={setMessageText}
                                multiline
                            />
                            <TouchableOpacity 
                                style={styles.sendButton}
                                onPress={handleSendMessage}
                                disabled={!messageText.trim()}
                            >
                                <LinearGradient
                                    colors={[COLORS.gradientPurple, COLORS.gradientPink]}
                                    style={styles.sendButtonGradient}
                                >
                                    <Ionicons 
                                        name="send" 
                                        size={moderateScale(20)} 
                                        color={COLORS.white} 
                                    />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
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
    header: {
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(5) : moderateScale(8),
        padding: moderateScale(15),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        padding: moderateScale(5),
        width: moderateScale(30),
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: moderateScale(10),
    },
    avatar: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        marginRight: moderateScale(10),
    },
    userTextInfo: {
        justifyContent: 'center',
    },
    username: {
        color: COLORS.white,
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
    userStatus: {
        color: COLORS.lightGray,
        fontSize: moderateScale(12),
    },
    placeholderView: {
        width: moderateScale(30),
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesContent: {
        flexGrow: 1,
        paddingHorizontal: moderateScale(15),
        paddingVertical: moderateScale(10),
    },
    emptyMessages: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: moderateScale(50),
    },
    emptyText: {
        color: COLORS.white,
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
    emptySubtext: {
        color: COLORS.lightGray,
        fontSize: moderateScale(14),
        textAlign: 'center',
        paddingHorizontal: moderateScale(30),
        marginTop: moderateScale(8),
    },
    messageContainer: {
        marginBottom: moderateScale(10),
        maxWidth: '80%',
    },
    ownMessageContainer: {
        alignSelf: 'flex-end',
    },
    otherMessageContainer: {
        alignSelf: 'flex-start',
    },
    ownMessage: {
        borderRadius: moderateScale(16),
        borderBottomRightRadius: moderateScale(4),
        padding: moderateScale(12),
    },
    otherMessage: {
        backgroundColor: COLORS.cardDark,
        borderRadius: moderateScale(16),
        borderBottomLeftRadius: moderateScale(4),
        padding: moderateScale(12),
    },
    messageText: {
        color: COLORS.white,
        fontSize: moderateScale(14),
    },
    messageTime: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: moderateScale(10),
        alignSelf: 'flex-end',
        marginTop: moderateScale(4),
    },
    inputContainer: {
        flexDirection: 'row',
        padding: moderateScale(10),
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    messageInput: {
        flex: 1,
        backgroundColor: COLORS.cardDark,
        borderRadius: moderateScale(20),
        padding: moderateScale(10),
        paddingHorizontal: moderateScale(15),
        color: COLORS.white,
        maxHeight: moderateScale(100),
    },
    sendButton: {
        marginLeft: moderateScale(10),
    },
    sendButtonGradient: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    failedIndicator: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
    },
    loadingMoreContainer: {
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20),
    },
    errorText: {
        color: COLORS.white,
        fontSize: moderateScale(16),
        fontWeight: 'bold',
        marginBottom: moderateScale(20),
    },
    retryButton: {
        padding: moderateScale(10),
        backgroundColor: COLORS.gradientPink,
        borderRadius: moderateScale(5),
    },
    retryButtonText: {
        color: COLORS.white,
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
});

export default ChatScreen;