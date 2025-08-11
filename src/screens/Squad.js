import React, { useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity, 
  Platform,
  Alert,
  FlatList,
  RefreshControl
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
import { Image } from "react-native";
import { getCompleteUserData } from "../components/squad/getUserDataFromFriendsContext";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MDYformatTimestamp } from "../components/timeZoneHelpers";
import GroupsInterface from "../components/squad/GroupsInterface";
import ReusableSearchBar from "../components/reusable/ReusableSearchBar";
import useProfilePictures from "../hooks/useProfilePictures";

const Squad = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Forums");
  const { 
    state: ForumState, 
    fetchPosts, 
    loadMorePosts, 
    createPost, likeComment, unlikeComment,
    clearForumCache 
  } = useContext(ForumContext);
  const { state: AuthState } = useContext(AuthContext);
  const { state: UserState } = useContext(UserContext); 
  const { state: FriendsState, getFriends, getFriendRequests, getUserById } = useContext(FriendsContext);
  const { state: MessagesState, getConversations, clearCache, clearConversationCache, deleteConversationById } = useContext(MessagesContext);
  const { fetchProfilePictures, getProfilePictureUrlFor, extractUsernames } = useProfilePictures();
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [enhancedConversations, setEnhancedConversations] = useState([]);
  
  // Track if friends data is already loaded
  const friendsLoaded = useRef(false);
  const justLeftForChat = useRef(false);
  
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
          await fetchPosts({ forceFetch: false, page: 1 });
          lastForumFetchTime.current = new Date().getTime();
        }

        // Load friends and friend requests
        if (FriendsState.friends.length === 0) {
          console.log('🔄 Loading friends data in Squad screen');
          getFriends();
        }
        if (FriendsState.friendRequests.length === 0) {
          console.log('🔄 Loading friend requests in Squad screen');
          getFriendRequests();
        }
      } catch (error) {
        console.error("❌ Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, []);

  // Refactored focus effect to be more reliable
  useFocusEffect(
    useCallback(() => {
      if (activeTab === "Messages" && justLeftForChat.current) {
        console.log("🔄 Refreshing messages after returning from chat");
        loadConversations(true);
        justLeftForChat.current = false; // Reset the flag after refreshing
      }
    }, [activeTab])
  );

  // Handle tab changes
  useEffect(() => {
    // Load appropriate data when tab changes
    if (activeTab === "Messages" && !initialDataLoaded.current.Messages) {
      // When switching to Messages tab, ensure friends are loaded first
      const loadMessagesData = async () => {
        console.log("🔄 Switching to Messages tab - loading data");
        await loadConversations(false); // Don't force refresh by default
        initialDataLoaded.current.Messages = true;
      };
      
      loadMessagesData();
    } else if (activeTab === "Forums" && !initialDataLoaded.current.Forums) {
      // Check if we need to refresh the forum posts
      const now = new Date().getTime();
      const timeSinceLastFetch = now - lastForumFetchTime.current;
      const shouldRefresh = timeSinceLastFetch > 5 * 60 * 1000; // 5 minutes
      
      if (shouldRefresh || ForumState.posts.length === 0) {
        console.log("🔄 Loading forum posts after tab change");
        fetchPosts({ forceFetch: false, page: 1 });
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
    if (!searchActive) {
      setFilteredPosts(ForumState.posts || []);
    }
  }, [ForumState.posts, searchActive]);

  // Track fetched usernames to prevent infinite loops
  const fetchedUsernames = useRef(new Set());
  
  // Fetch profile pictures for forum posts and ENHANCED conversations
  useEffect(() => {
    const fetchPictures = async () => {
      try {
        if (!extractUsernames || !fetchProfilePictures) {
          return;
        }

        // Extract usernames from forum posts and the now enhanced conversations
        const forumUsernames = extractUsernames(ForumState.posts, 'username');
        const conversationUsernames = extractUsernames(enhancedConversations, 'user.username');
        
        const allUsernames = [...new Set([...forumUsernames, ...conversationUsernames])];
        
        const unfetchedUsernames = allUsernames.filter(username => 
          username && !fetchedUsernames.current.has(username)
        );
        
        if (unfetchedUsernames.length > 0) {
          console.log(`📷 Squad: Fetching profile pictures for ${unfetchedUsernames.length} users from enhanced conversations`);
          unfetchedUsernames.forEach(username => fetchedUsernames.current.add(username));
          await fetchProfilePictures(unfetchedUsernames);
        }
      } catch (error) {
        console.warn('Squad: Error fetching profile pictures:', error);
      }
    };

    // Depend on enhancedConversations now
    if ((ForumState.posts.length > 0 || enhancedConversations.length > 0) &&
        extractUsernames && fetchProfilePictures) {
      fetchPictures();
    }
  }, [ForumState.posts, enhancedConversations]);

  // Effect to enhance conversations with full user data once friends are loaded
  useEffect(() => {
    if (MessagesState.conversations && FriendsState.friends.length > 0) {
      console.log("Enhancing conversations with friend data...");
      const enhanced = MessagesState.conversations.map(conv => {
        const enhancedUser = getCompleteUserData(conv.user, FriendsState, getUserById);
        return {
          ...conv,
          user: enhancedUser || conv.user,
        };
      });
      setEnhancedConversations(enhanced);
    } else if (MessagesState.conversations) {
      // If friends are not loaded, use the raw conversations
      setEnhancedConversations(MessagesState.conversations);
    }
  }, [MessagesState.conversations, FriendsState.friends]);

  const loadConversations = async (forceRefresh = false) => {
    setMessagesLoading(true);
    try {
      if (!UserState?.user?.uid) {
        console.warn("No user ID available in Squad screen");
        return;
      }

      console.log("🔄 Loading Messages tab data...");
      
      // CRITICAL: Always ensure friends data is loaded first, especially when forcing a refresh
      // This is needed to match user IDs to names and get profile pictures in conversations
      if (FriendsState.friends.length === 0 || forceRefresh) {
        console.log(`📋 ${forceRefresh ? "Force refreshing" : "Loading"} friends data first`);
        try {
          await getFriends(forceRefresh); // Pass forceRefresh to get latest friend data
        } catch (error) {
          console.error("❌ Failed to load friends:", error);
          // We can continue, but conversations might lack some user data
        }
      }
      
      // Check if conversations already exist in state
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
        console.log(`🔄 ${forceRefresh ? "Force refreshing" : "Loading"} conversations`);
        
        // Load conversations 
        await getConversations(UserState.user.uid, forceRefresh);
        
        // Save last refresh time
        try {
          await AsyncStorage.setItem(lastRefreshKey, now.toString());
        } catch (e) {
          console.error("Error saving last refresh time:", e);
        }
        
        console.log(`✅ Conversations loaded: ${MessagesState.conversations.length} conversations`);
      } else {
        console.log("📋 Using existing conversations data from state");
        setMessagesLoading(false);
      }
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
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
      postData.title,
      UserState.user?.profilePicturePath,
    );
    setShowCreatePostModal(false);
  };

  const handleSearchResults = (searchResults) => {
    setFilteredPosts(searchResults || []);
    setSearchActive(searchResults !== null);
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId);
    setProfileModalVisible(true);
  };

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    if (activeTab === "Forums") {
      setRefreshing(true);
      try {
        await fetchPosts({ forceFetch: true, page: 1 });
        lastForumFetchTime.current = new Date().getTime();
      } catch (error) {
        console.error("Error refreshing forum posts:", error);
      } finally {
        setRefreshing(false);
      }
    } else if (activeTab === "Messages") {
      setRefreshing(true);
      try {
        await loadConversations(true);
      } catch (error) {
        console.error("Error refreshing conversations:", error);
      } finally {
        setRefreshing(false);
      }
    }
  }, [activeTab]);

  // Handle load more posts when reaching the end
  const handleLoadMore = useCallback(async () => {
    // Don't load more if we're already loading, there's no more data, search is active, or there's an error
    if (ForumState.loadingMore || !ForumState.hasMore || searchActive || ForumState.error) {
      console.log(`⏭️ Skipping load more: loadingMore=${ForumState.loadingMore}, hasMore=${ForumState.hasMore}, searchActive=${searchActive}, error=${!!ForumState.error}`);
      return;
    }

    // Additional check to prevent rapid successive calls
    if (ForumState.posts.length === 0) {
      console.log("⏭️ No posts available for pagination");
      return;
    }

    try {
      // Use cursor-based pagination with the last post
      const lastPost = ForumState.posts[ForumState.posts.length - 1];
      if (lastPost && lastPost.id && lastPost.createdAt) { 
        console.log(`🔄 Loading more posts after post ${lastPost.id}...`);
        const result = await loadMorePosts({
          lastPostId: lastPost.id,
          lastCreatedAt: lastPost.createdAt,
          limit: 10
        });
        
        // Log the result for debugging
        console.log(`📊 Load more result: ${result.posts.length} posts, hasMore: ${result.hasMore}`);
      } else {
        console.warn("❌ Last post missing required pagination data:", { 
          id: lastPost?.id, 
          createdAt: lastPost?.createdAt 
        });
      }
    } catch (error) {
      console.error("❌ Error in handleLoadMore:", error);
    }
  }, [ForumState.loadingMore, ForumState.hasMore, ForumState.posts, ForumState.error, searchActive, loadMorePosts]);

  // Filter friend requests to show only received ones (where current user is the receiver)
  const currentUserId = AuthState.userId || UserState.user?.uid;
  const incomingRequests = FriendsState.friendRequests.filter(
    request => request.status === 'pending' && request.receiver === currentUserId
  );
  
  // Debug logging
  console.log('🔍 Debug friend requests:', {
    currentUserId,
    totalRequests: FriendsState.friendRequests.length,
    pendingRequests: FriendsState.friendRequests.filter(r => r.status === 'pending').length,
    incomingRequests: incomingRequests.length,
    allRequests: FriendsState.friendRequests.map(r => ({ 
      status: r.status, 
      sender: r.sender, 
      receiver: r.receiver,
      isIncoming: r.receiver === currentUserId
    }))
  });

  // Navigate to conversation screen with already enhanced user data
  const navigateToConversation = (otherUser) => {
    // Set a flag to indicate we're navigating to a chat
    justLeftForChat.current = true;

    // Ensure the user object passed to the chat screen has the best available avatar URL
    const username = otherUser?.username;
    const profilePictureUrl = getProfilePictureUrlFor ? getProfilePictureUrlFor(username) : null;
    const finalAvatarUrl = otherUser?.avatar || profilePictureUrl;

    const userToPass = {
        ...otherUser,
        avatar: finalAvatarUrl, // Ensure the avatar property has the final, correct URL
    };

    navigation.navigate('ChatScreen', { otherUser: userToPass });
  };

  const deleteConversation = (conversationId) => { 
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            await deleteConversationById(conversationId);
            // Force refresh conversations after deletion
            loadConversations(true); 
          }
        }
      ]
    ); 
  };

  // Render conversation item with already enhanced user data
  const renderConversationItem = ({ item }) => {
    // The `item` is now from `enhancedConversations`, so `item.user` should be complete.
    const enhancedUser = item.user;

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigateToConversation(enhancedUser)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ 
              uri: (() => {
                const username = enhancedUser?.username;
                
                if (!username || typeof username !== 'string') {
                  return 'https://randomuser.me/api/portraits/lego/1.jpg';
                }
                
                const profilePictureUrl = getProfilePictureUrlFor ? getProfilePictureUrlFor(username) : null;
                const avatarUrl = enhancedUser?.avatar || profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg';
                
                return avatarUrl;
              })()
            }} 
            style={styles.avatar}
            onError={(error) => {
              const username = enhancedUser?.username || 'unknown';
              console.warn(`❌ Failed to load Squad conversation avatar for ${username}:`, error.nativeEvent.error);
            }} 
          />
          {/* Online indicator - will need to be implemented with real data */}
          {enhancedUser?.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.username}>
              {enhancedUser?.username || enhancedUser?.displayName || 'Loading...'}
            </Text>
            <Text style={styles.timestamp}>{MDYformatTimestamp(item.lastMessageTime)}</Text>
          </View>
          <View style={styles.messagePreviewContainer}>
            <Text style={styles.messagePreview} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            <TouchableOpacity style={{position:'absolute', right: moderateScale(0), top: moderateScale(0), padding: moderateScale(0), flexDirection: 'row', alignItems: 'center'}} onPress={() => deleteConversation(item.id)}>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                </View>
              )}
              <Ionicons name="trash-outline" size={moderateScale(20)} color="gray" />
            </TouchableOpacity>
            
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
      <HeightSpacer height={moderateScale(40)} />
      <Text style={styles.emptySubtext}>You can add friends by username in the friends tab or by interacting with their profiles in the forums or groups.</Text>
    </View>
  );

  // Render forum post item for FlatList
  const renderForumPost = ({ item }) => (
    <ForumPost
      post={item}
      navigation={navigation}
      onAvatarPress={() => openUserProfile(item.userId)}
      onLikeComment={likeComment}
      onUnlikeComment={unlikeComment}
      currentUserId={AuthState.userId || UserState.user?.uid}
    />
  );

  // Render load more footer
  const renderLoadMoreFooter = () => {
    if (!ForumState.loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={COLORS.gradientPink} />
        <Text style={styles.loadMoreText}>Loading more posts...</Text>
      </View>
    );
  };

  // Render empty forums
  const renderEmptyForums = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses" size={moderateScale(50)} color={COLORS.lightGray} />
      <HeightSpacer height={10} />
      <Text style={styles.emptyText}>No posts yet! Be the first to share something.</Text>
    </View>
  );

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
        {activeTab === "Forums" ? (
          <SearchBar 
            posts={ForumState.posts} 
            onSearchResults={handleSearchResults} 
          />
        ) : activeTab === "Messages" ? (
          <ReusableSearchBar 
            placeholder="Search messages"
            onSearchResults={handleSearchResults}
          />
        ) : (
          <ReusableSearchBar 
            placeholder="Search groups"
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
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderForumPost}
          contentContainerStyle={styles.forumListContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.gradientPink]}
              tintColor={COLORS.gradientPink}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderLoadMoreFooter}
          ListEmptyComponent={ForumState.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.gradientPink} />
              <Text style={styles.loadingText}>Loading community posts...</Text>
            </View>
          ) : renderEmptyForums}
        />
      ) : activeTab === "Messages" ? (
        // Messages Tab Content
        messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gradientPink} />
            <Text style={styles.loadingText}>
              {FriendsState.loading ? "Loading friends and conversations..." : "Loading conversations..."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={enhancedConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.gradientPink]}
                tintColor={COLORS.gradientPink}
              />
            }
            ListEmptyComponent={renderEmptyMessages}
          />
        )
      ) : (
        <GroupsInterface /> 
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
    fontSize: moderateScale(18),
    fontWeight: "bold",
    marginTop: moderateScale(5),
  },
  // Updated styles for FlatList
  forumListContainer: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(20),
    flexGrow: 1,
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
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(20),
  },
  loadMoreText: {
    color: COLORS.lightGray,
    marginLeft: moderateScale(10),
    fontSize: moderateScale(14),
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
    backgroundColor: COLORS.cardDark, // Add background color for debugging
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
    position: 'absolute',
    right: moderateScale(0),
    top: moderateScale(0),
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
    marginHorizontal: moderateScale(5),
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
});