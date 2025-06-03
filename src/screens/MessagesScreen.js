import React, { useEffect, useState, useContext } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator,
    SafeAreaView,
    Platform
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/COLORS';
import HeightSpacer from '../components/reusable/HeightSpacer';
import { Context as MessagesContext } from '../context/MessagesContext';

import Constants from 'expo-constants';
import { MDYformatTimestamp } from '../components/timeZoneHelpers';

const MessagesScreen = ({ navigation }) => {
    const { state: messagesState, getConversations } = useContext(MessagesContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            setLoading(true);
            await getConversations();
            setLoading(false); 
        };

        fetchConversations();

        // Refresh conversations when the screen is focused
        const unsubscribe = navigation.addListener('focus', fetchConversations);
        return unsubscribe;
    }, [navigation]);

    // Navigate to conversation screen
    const navigateToConversation = (otherUser) => {
        navigation.navigate('ChatScreen', { otherUser });
    };

    // Render individual conversation item
    const renderConversationItem = ({ item }) => {
        return (
            <TouchableOpacity 
                style={styles.conversationItem}
                onPress={() => navigateToConversation(item.user)}
            >
                <View style={styles.avatarContainer}>
                    <Image 
                        source={{ uri: item.user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} 
                        style={styles.avatar} 
                    />
                    {/* Online indicator - will need to be implemented with real data */}
                    {item.user.isOnline && (
                        <View style={styles.onlineIndicator} />
                    )}
                </View>
                <View style={styles.conversationInfo}>
                    <View style={styles.conversationHeader}>
                        <Text style={styles.username}>{item.user.username || 'Unknown User'}</Text>
                        <Text style={styles.timestamp}>{MDYformatTimestamp(item.lastMessageTime)}</Text>
                    </View>
                    <View style={styles.messagePreviewContainer}>
                        <Text style={styles.messagePreview} numberOfLines={1}>
                            {item.lastMessage || 'No messages yet'}
                        </Text>
                        {item.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Messages</Text>
                <View style={styles.placeholderView} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.gradientPink} />
                </View>
            ) : messagesState.conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses" size={moderateScale(50)} color={COLORS.lightGray} />
                    <HeightSpacer height={10} />
                    <Text style={styles.emptyText}>No conversations yet</Text>
                    <HeightSpacer height={10} />
                    <Text style={styles.emptySubtext}>Start a conversation with a friend!</Text>
                </View>
            ) : (
                <FlatList
                    data={messagesState.conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversationItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    },
    backButton: {
        padding: moderateScale(5),
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: moderateScale(22),
        fontWeight: 'bold',
    },
    placeholderView: {
        width: moderateScale(24), // Same width as the back button for alignment
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: verticalScale(50),
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
    },
    listContainer: {
        paddingHorizontal: moderateScale(15),
        paddingBottom: moderateScale(20),
    },
    conversationItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.cardDark,
        padding: moderateScale(12),
        borderRadius: moderateScale(8),
        marginBottom: moderateScale(10),
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: moderateScale(12),
    },
    avatar: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
    },
    onlineIndicator: {
        position: 'absolute',
        width: moderateScale(12),
        height: moderateScale(12),
        backgroundColor: COLORS.accentGreen,
        borderRadius: moderateScale(6),
        borderWidth: 2,
        borderColor: COLORS.darkBackground,
        bottom: 0,
        right: 0,
    },
    conversationInfo: {
        flex: 1,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: moderateScale(4),
    },
    username: {
        color: COLORS.white,
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    timestamp: {
        color: COLORS.lightGray,
        fontSize: moderateScale(12),
    },
    messagePreviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
        color: COLORS.lightGray,
        fontSize: moderateScale(13),
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: COLORS.gradientPink,
        width: moderateScale(18),
        height: moderateScale(18),
        borderRadius: moderateScale(9),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: moderateScale(8),
    },
    unreadCount: {
        color: COLORS.white,
        fontSize: moderateScale(10),
        fontWeight: 'bold',
    },
});

export default MessagesScreen; 