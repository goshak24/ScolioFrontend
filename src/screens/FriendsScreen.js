import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    SafeAreaView, 
    Platform,
    RefreshControl
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/COLORS';
import HeightSpacer from '../components/reusable/HeightSpacer';
import { Context as FriendsContext } from '../context/FriendsContext';
import { Context as UserContext } from '../context/UserContext';
import UserProfileModal from '../components/profile/UserProfileModal';
import DirectMessageButton from '../components/messaging/DirectMessageButton';
import Constants from 'expo-constants'; 

const FriendsScreen = ({ navigation }) => {
    const { 
        state: friendsState, 
        getFriends, 
        getFriendRequests, 
        respondToFriendRequest, 
        removeFriend 
    } = useContext(FriendsContext);
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends' or 'requests'
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    // Fetch friends and requests on mount - Fixed dependency array
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                
                // Fetch both friends and requests in parallel
                await Promise.all([
                    getFriends(false),
                    getFriendRequests(false)
                ]);
                
            } catch (error) {
                console.error('Error loading friends data:', error);
                Alert.alert("Error", "Failed to load friends data");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []); // Empty dependency array - only run on mount

    // Separate function for refresh
    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            
            // Force refresh both friends and requests
            await Promise.all([
                getFriends(true),
                getFriendRequests(true)
            ]);
            
        } catch (error) {
            console.error('Error refreshing friends data:', error);
            Alert.alert("Error", "Failed to refresh friends data");
        } finally {
            setRefreshing(false);
        }
    }, [getFriends, getFriendRequests]);

    // Filter friend requests to show only received ones for the requests tab
    const incomingRequests = friendsState.friendRequests.filter(
        request => request.type === 'received'
    );

    // Handle accepting a friend request
    const handleAcceptRequest = async (requestId) => {
        try {
            const result = await respondToFriendRequest(requestId, 'accept');
            
            if (typeof result === 'function') {
                // Handle the case where result is a function (legacy support)
                const actualResult = result(friendsState);
                if (actualResult.success) {
                    Alert.alert("Success", "Friend request accepted!");
                } else {
                    Alert.alert("Error", actualResult.error || "Failed to accept request");
                }
            } else if (result.success) {
                Alert.alert(
                    "Success", 
                    result.message || "Friend request accepted!",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Error", result.error || "Failed to accept request");
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    // Handle rejecting a friend request
    const handleRejectRequest = async (requestId) => {
        try {
            const result = await respondToFriendRequest(requestId, 'reject');
            
            if (typeof result === 'function') {
                // Handle the case where result is a function (legacy support)
                const actualResult = result(friendsState);
                if (actualResult.success) {
                    Alert.alert("Success", "Friend request rejected");
                } else {
                    Alert.alert("Error", actualResult.error || "Failed to reject request");
                }
            } else if (result.success) {
                Alert.alert(
                    "Success", 
                    result.message || "Friend request rejected",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Error", result.error || "Failed to reject request");
            }
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    // Handle removing a friend
    const handleRemoveFriend = (friendId, friendName) => {
        Alert.alert(
            "Remove Friend",
            `Are you sure you want to remove ${friendName || 'this friend'}?`,
            [
                { 
                    text: "Cancel", 
                    style: "cancel" 
                },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const result = await removeFriend(friendId);
                            if (result.success) {
                                Alert.alert(
                                    "Success", 
                                    result.message || "Friend removed",
                                    [{ text: "OK" }]
                                );
                            } else {
                                Alert.alert("Error", result.error || "Failed to remove friend");
                            }
                        } catch (error) {
                            console.error('Error removing friend:', error);
                            Alert.alert("Error", "An unexpected error occurred");
                        }
                    }
                }
            ]
        );
    };

    const openUserProfile = useCallback((userId) => {
        setSelectedUserId(userId);
        setProfileModalVisible(true);
    }, []); 

    // Render a friend request item
    const renderRequestItem = useCallback((request) => {
        return (
            <View key={request.id} style={styles.requestCard}>
                <TouchableOpacity 
                    style={styles.requestAvatarContainer}
                    onPress={() => openUserProfile(request.user.id)}
                >
                    <Image 
                        source={{ 
                            uri: request.user.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' 
                        }} 
                        style={styles.requestAvatar} 
                    />
                </TouchableOpacity>
                <View style={styles.requestInfo}>
                    <Text style={styles.requestUsername}>
                        {request.user.username || 'Unknown User'}
                    </Text>
                    <Text style={styles.requestTime}>Wants to be your friend</Text>
                    {request.user.treatmentStage && (
                        <View style={styles.treatmentBadgeSmall}>
                            <Text style={styles.treatmentTextSmall}>
                                {request.user.treatmentStage}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.requestActions}>
                    <TouchableOpacity 
                        style={[styles.requestActionButton, styles.acceptButton]}
                        onPress={() => handleAcceptRequest(request.id)}
                    >
                        <Ionicons name="checkmark" size={moderateScale(18)} color={COLORS.white} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.requestActionButton, styles.rejectButton]}
                        onPress={() => handleRejectRequest(request.id)}
                    >
                        <Ionicons name="close" size={moderateScale(18)} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [openUserProfile, handleAcceptRequest, handleRejectRequest]);

    // Render a friend item
    const renderFriendItem = useCallback((friend) => {
        return (
            <TouchableOpacity 
                key={friend.id} 
                style={styles.friendCard}
                onPress={() => openUserProfile(friend.id)}
            >
                <Image 
                    source={{ 
                        uri: friend.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' 
                    }} 
                    style={styles.friendAvatar} 
                />
                <View style={styles.friendInfo}>
                    <Text style={styles.friendUsername}>
                        {friend.username || 'Unknown User'}
                    </Text>
                    {friend.treatmentStage && (
                        <View style={styles.treatmentBadge}>
                            <Text style={styles.treatmentText}>{friend.treatmentStage}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.friendActions}>
                    <DirectMessageButton 
                        user={friend} 
                        iconSize={16}
                        style={styles.messageButton}
                    />
                    <TouchableOpacity 
                        style={styles.friendMoreButton}
                        onPress={() => handleRemoveFriend(friend.id, friend.username)}
                    >
                        <Ionicons name="ellipsis-vertical" size={moderateScale(18)} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    }, [openUserProfile, handleRemoveFriend]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={moderateScale(24)} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Friends</Text>
                <View style={styles.placeholderView} />
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                        My Friends
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.gradientPink} />
                </View>
            ) : activeTab === 'friends' ? (
                <ScrollView 
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.gradientPink}
                            colors={[COLORS.gradientPink]}
                        />
                    }
                >
                    {friendsState.friends.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people" size={moderateScale(50)} color={COLORS.lightGray} />
                            <HeightSpacer height={10} />
                            <Text style={styles.emptyText}>You don't have any friends yet</Text>
                            <HeightSpacer height={10} />
                            <Text style={styles.emptySubtext}>Connect with others in the community!</Text>
                        </View>
                    ) : (
                        friendsState.friends.map(renderFriendItem)
                    )}
                </ScrollView>
            ) : (
                <ScrollView 
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.gradientPink}
                            colors={[COLORS.gradientPink]}
                        />
                    }
                >
                    {incomingRequests.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="mail-open" size={moderateScale(50)} color={COLORS.lightGray} />
                            <HeightSpacer height={10} />
                            <Text style={styles.emptyText}>No friend requests</Text>
                            <HeightSpacer height={10} />
                            <Text style={styles.emptySubtext}>When someone sends you a request, it will appear here</Text>
                        </View>
                    ) : (
                        incomingRequests.map(renderRequestItem)
                    )}
                </ScrollView>
            )}

            {/* User Profile Modal */}
            <UserProfileModal
                visible={profileModalVisible}
                onClose={() => setProfileModalVisible(false)}
                userId={selectedUserId}
            />
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
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: moderateScale(15),
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: COLORS.gradientPurple,
    },
    tabText: {
        color: COLORS.lightGray,
        fontSize: moderateScale(14),
    },
    activeTabText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: moderateScale(15),
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
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardDark,
        padding: moderateScale(12),
        borderRadius: moderateScale(8),
        marginBottom: moderateScale(10),
    },
    requestAvatarContainer: {
        marginRight: moderateScale(12),
    },
    requestAvatar: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
    },
    requestInfo: {
        flex: 1,
    },
    requestUsername: {
        color: COLORS.white,
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    requestTime: {
        color: COLORS.lightGray,
        fontSize: moderateScale(12),
    },
    requestActions: {
        flexDirection: 'row',
    },
    requestActionButton: {
        width: moderateScale(35),
        height: moderateScale(35),
        borderRadius: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: moderateScale(5),
    },
    acceptButton: {
        backgroundColor: COLORS.accentGreen,
    },
    rejectButton: {
        backgroundColor: COLORS.red,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardDark,
        padding: moderateScale(12),
        borderRadius: moderateScale(8),
        marginBottom: moderateScale(10),
    },
    friendAvatar: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        marginRight: moderateScale(12),
    },
    friendInfo: {
        flex: 1,
    },
    friendUsername: {
        color: COLORS.white,
        fontSize: moderateScale(14),
        fontWeight: 'bold',
        marginBottom: moderateScale(5),
    },
    treatmentBadge: {
        backgroundColor: COLORS.badgeBackground,
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(3),
        borderRadius: moderateScale(4),
        alignSelf: 'flex-start',
    },
    treatmentBadgeSmall: {
        backgroundColor: COLORS.badgeBackground,
        paddingHorizontal: moderateScale(6),
        paddingVertical: moderateScale(2),
        borderRadius: moderateScale(3),
        alignSelf: 'flex-start',
        marginTop: moderateScale(4),
    },
    treatmentText: {
        color: COLORS.white,
        fontSize: moderateScale(10),
    },
    treatmentTextSmall: {
        color: COLORS.white,
        fontSize: moderateScale(9),
    },
    friendActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendMoreButton: {
        width: moderateScale(35),
        height: moderateScale(35),
        borderRadius: moderateScale(18),
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: moderateScale(8),
    },
    messageButton: {
        marginRight: moderateScale(5),
    },
});

export default FriendsScreen;