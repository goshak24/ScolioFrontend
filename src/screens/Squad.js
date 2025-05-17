import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity, 
  Platform
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../constants/COLORS";
import ReusableButton from "../components/reusable/ReusableButton";
import ForumPost from "../components/squad/ForumPost";
import ForumTabs from "../components/squad/ForumTabs";
import HeightSpacer from "../components/reusable/HeightSpacer"; 
import { Context as ForumContext } from '../context/ForumContext';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext'; 
import { Context as FriendsContext } from '../context/FriendsContext';
import { Context as MessagesContext } from '../context/MessagesContext';
import { format, isToday, isYesterday } from 'date-fns';
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Constants from 'expo-constants';
import CreatePostModal from "../components/squad/CreatePostModal";
import SearchBar from "../components/squad/SearchBar";
import UserProfileModal from "../components/profile/UserProfileModal";
import { FlatList, Image } from "react-native";
import userCache from "../utilities/userCache";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Squad = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Forums");
  const { state: ForumState, fetchPosts, createPost } = useContext(ForumContext);
  const { state: AuthState } = useContext(AuthContext);
  const { state: UserState } = useContext(UserContext); 
  const { state: FriendsState, getFriends, getFriendRequests, getUserById } = useContext(FriendsContext);
  const { state: MessagesState, getConversations, clearCache, clearConversationCache } = useContext(MessagesContext);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [forumLoading, setForumLoading] = useState(true);
  
  // Track if friends data is already loaded
  const friendsLoaded = useRef(false);
  
  // Track if initial data load happened for the current tab
  const initialDataLoaded = useRef({
    Forums: false,
    Messages: false
  });
  
  // Track when the screen was last focused and the last time we fetched forum posts
  const lastFocusTime = useRef(new Date().getTime());
  const lastForumFetchTime = useRef(0);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load forum posts first
        if (ForumState.posts.length === 0) {
          console.log("🔄 Loading initial forum posts");
          setForumLoading(true);
          await fetchPosts(false); // Use cache if available
          lastForumFetchTime.current = new Date().getTime();
        } else {
          console.log("📋 Using existing forum posts from state");
        }
      } catch (error) {
        console.error("❌ Error loading initial data:", error);
      } finally {
        setForumLoading(false);
      }

      // Load friend-related data
      if (FriendsState.friendRequests.length === 0) {
        getFriendRequests();
      }
      
      if (!friendsLoaded.current && FriendsState.friends.length === 0) {
        friendsLoaded.current = true;
        getFriends();
      }
    };

    loadInitialData();
  }, []);
  
  // Update forum loading state when ForumState changes
  useEffect(() => {
    if (ForumState.loading !== undefined) {
      setForumLoading(ForumState.loading);
    }
  }, [ForumState.loading]);
  
  // Reset data load flags when the screen is focused
  useFocusEffect(
    useCallback(() => {
      const now = new Date().getTime();
      
      // Only refresh data if returning after a significant time (e.g., 2+ minutes)
      const timeSinceLastFocus = now - lastFocusTime.current;
      const shouldRefreshOnFocus = timeSinceLastFocus > 2 * 60 * 1000; // 2 minutes
      
      if (activeTab === "Forums" && shouldRefreshOnFocus) {
        // If it's been a while since we last fetched forums, refresh them
        const timeSinceLastForumFetch = now - lastForumFetchTime.current;
        const shouldRefreshForums = timeSinceLastForumFetch > 5 * 60 * 1000; // 5 minutes
        
        if (shouldRefreshForums) {
          console.log("🔄 Refreshing forum posts after returning to screen");
          fetchPosts(true); // Force refresh
          lastForumFetchTime.current = now;
        }
      } else if (activeTab === "Messages" && shouldRefreshOnFocus) {
        // Only reload conversations when returning after significant time away
        initialDataLoaded.current.Messages = false;
        lastFocusTime.current = now;
      }
      
      // Update last focus time
      lastFocusTime.current = now;
      
      return () => {
        // No cleanup needed
      };
    }, [activeTab])
  );

  // Handle tab changes
  useEffect(() => {
    // Load appropriate data when tab changes
    if (activeTab === "Messages" && !initialDataLoaded.current.Messages) {
      loadConversations(false); // Don't force refresh by default
      initialDataLoaded.current.Messages = true;
    } else if (activeTab === "Forums" && !initialDataLoaded.current.Forums) {
      // Check if we need to refresh the forum posts
      const now = new Date().getTime();
      const timeSinceLastFetch = now - lastForumFetchTime.current;
      const shouldRefresh = timeSinceLastFetch > 5 * 60 * 1000; // 5 minutes
      
      if (shouldRefresh || ForumState.posts.length === 0) {
        console.log("🔄 Loading forum posts after tab change");
        fetchPosts(false); // Use cache if available
        lastForumFetchTime.current = now;
      }
      
      initialDataLoaded.current.Forums = true;
    }
  }, [activeTab]);

  // Additional effect to manage Messages tab state
  useEffect(() => {
    // When switching away from Messages tab, we can clean up any inactive listeners
    if (activeTab !== "Messages" && initialDataLoaded.current.Messages) {
      console.log("Switching away from Messages tab, cleaning up ALL listeners");
      clearCache('all_listeners'); // Use our new function to force clear all listeners
    }
  }, [activeTab]);

  // Add more aggressive cleanup on app unmount
  useEffect(() => {
    return () => {
      console.log("Squad screen unmounting, doing complete Firebase cleanup");
      clearCache('all_listeners');
    };
  }, []);

  useEffect(() => {
    // Update filtered posts when ForumState.posts changes
    setFilteredPosts(ForumState.posts || []);
  }, [ForumState.posts]);

  const loadConversations = async (forceRefresh = false) => {
    setMessagesLoading(true);
    try {
      if (!UserState?.user?.uid) {
        console.warn("No user ID available in Squad screen");
      } else {
        console.log("Loading conversations for user");
        
        // First check if conversations already exist in state
        const hasExistingConversations = MessagesState.conversations.length > 0;
        
        // Check how long since the last refresh
        const now = new Date().getTime();
        const lastRefreshKey = 'last_conv_refresh_time';
        let lastRefreshTime = 0;
        
        try {
          const storedTime = await AsyncStorage.getItem(lastRefreshKey);
          if (storedTime) {
            lastRefreshTime = parseInt(storedTime, 10);
          }
        } catch (e) {
          console.error("Error getting last refresh time:", e);
        }
        
        const timeSinceLastRefresh = now - lastRefreshTime;
        const refreshInterval = 5 * 60 * 1000; // 5 minutes
        
        // Determine if we need to refresh
        const needsRefresh = forceRefresh || 
                             !hasExistingConversations || 
                             timeSinceLastRefresh > refreshInterval;
        
        if (needsRefresh) {
          console.log(`${forceRefresh ? "Force refreshing" : "Loading"} conversations`);
          
          // Make sure friends data is loaded first if needed
          if (FriendsState.friends.length === 0 && !FriendsState.loading) {
            console.log("Loading friends data first");
            await getFriends(false); // Don't force refresh friends
          }
          
          // Now load conversations - pass force refresh flag if explicitly requested
          await getConversations(UserState.user.uid, forceRefresh);
          
          // Save last refresh time
          try {
            await AsyncStorage.setItem(lastRefreshKey, now.toString());
          } catch (e) {
            console.error("Error saving last refresh time:", e);
          }
        } else {
          console.log("Using existing conversations data from state, no refresh needed");
          setMessagesLoading(false);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleNewThread = () => {
    setShowCreatePostModal(true);
  };

  const handleCreatePost = (postData) => {
    // Add username and user ID to post data
    createPost(
      AuthState.userId || "user123", 
      UserState.user.username || "TestUser", 
      postData.content, 
      postData.tags,
      postData.title
    );
    setShowCreatePostModal(false);
  };

  const handleSearchResults = (searchResults) => {
    setFilteredPosts(searchResults || []);
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  // Filter friend requests to show only received ones
  const incomingRequests = FriendsState.friendRequests.filter(
    request => request.type === 'received'
  );

  // Format the timestamp for display in messages
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    try {
      // Handle Firebase timestamp object
      let date;
      if (timestamp._seconds) {
          date = new Date(timestamp._seconds * 1000);
      } else if (timestamp.seconds) {
          date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
          date = timestamp;
      } else if (typeof timestamp === 'string') {
          date = new Date(timestamp);
      } else {
          return ""; // Return empty string for invalid timestamps
      }
      
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
          return "";
      }

      if (isToday(date)) {
          return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
          return 'Yesterday';
      } else {
          return format(date, 'MM/dd/yyyy');
      }
    } catch (error) {
      console.warn("Error formatting timestamp:", error);
      return "";
    }
  };

  // Enhanced function to get complete user data
  const getCompleteUserData = (user) => {
    if (!user || !user.id) return user;
    
    // Already has all the data we need
    if (user.username && user.avatar) return user;
    
    // First check user cache
    const cachedUser = userCache.getCachedUser(user.id);
    if (cachedUser && (cachedUser.username || cachedUser.avatar)) {
      return {
        ...user,
        username: user.username || cachedUser.username,
        avatar: user.avatar || cachedUser.avatar
      };
    }
    
    // Check friends list
    const friendMatch = FriendsState.friends.find(friend => friend.id === user.id);
    if (friendMatch) {
      const enhancedUser = {
        ...user,
        username: user.username || friendMatch.username || friendMatch.displayName,
        avatar: user.avatar || friendMatch.avatar
      };
      
      // Cache for future use
      userCache.cacheUser(enhancedUser);
      return enhancedUser;
    }
    
    // Return original if nothing found
    return user;
  };

  // Navigate to conversation screen with enhanced user data
  const navigateToConversation = (otherUser) => {
    // Get complete user data
    const enhancedUser = getCompleteUserData(otherUser);
    
    // Navigate to chat screen with enhanced user data
    navigation.navigate('ChatScreen', { otherUser: enhancedUser });
  };

  // Render conversation item with enhanced user data
  const renderConversationItem = ({ item }) => {
    // Enhance user data with cached/friends data
    item.user = getCompleteUserData(item.user);

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
            <Text style={styles.timestamp}>{formatTimestamp(item.lastMessageTime)}</Text>
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

  // Render empty messages
  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses" size={moderateScale(50)} color={COLORS.lightGray} />
      <HeightSpacer height={10} />
      <Text style={styles.emptyText}>No conversations yet</Text>
      <HeightSpacer height={10} />
      <Text style={styles.emptySubtext}>Start a conversation with a friend!</Text>
    </View>
  );

  // Render a loading indicator for forums
  const renderForumLoading = () => {
    if (forumLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gradientPink} />
          <Text style={styles.loadingText}>Loading community posts...</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}> 
        <View style={styles.titleContainer}>
          <Text style={styles.squadTitle}>Squad</Text>
          
          {/* Friends Button with request count indicator */}
          <TouchableOpacity 
            style={styles.friendsButton} 
            onPress={() => navigation.navigate("FriendsScreen")}
          >
            <Ionicons name="people" size={moderateScale(22)} color={COLORS.white} />
            {incomingRequests.length > 0 && (
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>{incomingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar - Only show for Forums tab */}
        {activeTab === "Forums" && (
          <SearchBar 
            posts={ForumState.posts} 
            onSearchResults={handleSearchResults} 
          />
        )}

        {/* Tab Navigation */}
        <ForumTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <HeightSpacer height={moderateScale(5)} />

        {/* Popular Discussions + New Thread Button - Only show for Forums tab */}
        {activeTab === "Forums" && (
          <View style={styles.headerRow}>
            <Text style={styles.sectionHeader}>Popular Discussions</Text>
            <ReusableButton
              onPress={handleNewThread}
              btnText="⊕ New Thread"
              fontSize={moderateScale(14)}
              height={moderateScale(30)}
              borderRadius={moderateScale(20)}
              gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
              width="auto"
              useGradient={true}
            />
          </View>
        )}

        {/* Messages Tab Title */}
        {activeTab === "Messages" && (
          <View style={styles.headerRow}>
            <Text style={styles.sectionHeader}>Your Conversations</Text>
          </View>
        )}
      </View>

      {/* Tab Content */}
      {activeTab === "Forums" ? (
        <>
          {renderForumLoading()}
          
          {!forumLoading && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.postsContainer}>
                {/* Only render posts if we're not loading */}
                {!forumLoading && filteredPosts.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No posts yet! Be the first to share something.</Text>
                  </View>
                )}
                
                {filteredPosts.map((post) => (
                  <ForumPost
                    key={post.id}
                    post={post}
                    navigation={navigation}
                    onAvatarPress={() => openUserProfile(post.userId)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
          
          
        </>
      ) : activeTab === "Messages" ? (
        // Messages Tab Content
        messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gradientPink} />
          </View>
        ) : (
          <FlatList
            data={MessagesState.conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyMessages}
          />
        )
      ) : (
        // Groups Tab (placeholder)
        <View style={styles.emptyContainer}>
          <Ionicons name="people-circle" size={moderateScale(50)} color={COLORS.lightGray} />
          <HeightSpacer height={10} />
          <Text style={styles.emptyText}>Groups coming soon</Text>
          <HeightSpacer height={10} />
          <Text style={styles.emptySubtext}>This feature is under development</Text>
        </View>
      )}

      {/* Create Post Modal */}
      <CreatePostModal 
        visible={showCreatePostModal}
        onClose={() => setShowCreatePostModal(false)}
        onSubmit={handleCreatePost}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        userId={selectedUserId}
      />
    </SafeAreaView>
  );
};

export default Squad;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground 
  },
  innerContainer: {
    paddingHorizontal: moderateScale(10), 
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10)
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    marginBottom: moderateScale(15)
  },
  squadTitle: {
    color: COLORS.white,
    fontSize: moderateScale(22),
    fontWeight: "bold",
  },
  friendsButton: {
    backgroundColor: COLORS.gradientPurple,
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.gradientPink,
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkBackground,
  },
  requestBadgeText: {
    color: COLORS.white,
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(20)
  },
  sectionHeader: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginTop: moderateScale(5),
  },
  postsContainer: {
    flex: 1,
  },
  postsContent: {
    paddingBottom: moderateScale(20),
    paddingHorizontal: moderateScale(10),
  },
  noResultsText: {
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: moderateScale(30),
    fontSize: moderateScale(16),
  },
  // New styles for Messages tab
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
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
  },
  listContainer: {
    paddingHorizontal: moderateScale(15),
    paddingTop: moderateScale(5),
    paddingBottom: moderateScale(20),
    flexGrow: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20)
  },
  loadingText: {
    color: COLORS.white,
    marginTop: moderateScale(10),
    fontSize: moderateScale(14)
  },
  scrollContainer: {
    paddingBottom: moderateScale(20),
    paddingHorizontal: moderateScale(10),
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: moderateScale(10),
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(20),
  },
});