import React, { useContext, useState, useEffect, useRef } from "react";
import {
  View, 
  Text, 
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView
} from "react-native";
import { moderateScale, verticalScale } from "react-native-size-matters";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/COLORS";
import PostHeader from "./PostHeader";
import PostContent from "./PostContent";
import CommentItem from "./CommentItem";
import { format } from "date-fns";
import HeightSpacer from "../reusable/HeightSpacer";
import Constants from 'expo-constants'; 
import { Context as AuthContext } from '../../context/AuthContext'; 
import { Context as ForumContext } from '../../context/ForumContext'; 
import { Context as UserContext } from '../../context/UserContext';
import UserProfileModal from '../profile/UserProfileModal';
import useProfilePictures from "../../hooks/useProfilePictures";

const ForumPostScreen = ({ route, navigation }) => { 
  const { state: AuthState, printUserId } = useContext(AuthContext); 
  const { state: ForumState, likePost, unlikePost, addComment, likeComment, unlikeComment, deletePost } = useContext(ForumContext); 
  const { state: UserState } = useContext(UserContext); 
  const { fetchProfilePictures, getProfilePictureUrlFor, extractUsernames } = useProfilePictures();

  // Get initial post data from route params
  const { post: initialPost } = route.params || {};
  const postId = initialPost?.id;
  
  // Find the latest version of this post from the forum state
  // This ensures we always have the most up-to-date comments
  const currentPost = ForumState.posts.find(p => p.id === postId) || initialPost;
  
  // Safely extract post data with defaults
  const safePost = {
    postId: currentPost?.id || "1",
    userId: currentPost?.userId || "1",
    username: currentPost?.username || "Anonymous",
    avatar: currentPost?.avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
    content: currentPost?.content || "No content available",
    createdAt: currentPost?.createdAt || { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 },
    likes: currentPost?.likes || [],
    tags: currentPost?.tags || [],
    comments: currentPost?.comments || [] // Comments should always be an array
  }; 

  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const fetchedUsernames = useRef(new Set());

  // Update like state whenever the post changes
  useEffect(() => {
    const userId = AuthState.userId || UserState.user?.uid;
    setIsLiked(userId ? safePost.likes?.includes(userId) : false);
    setLikeCount(safePost.likes?.length || 0);
  }, [safePost.likes, AuthState.userId, UserState.user]);

  // Helper to get valid userId
  const getUserId = () => {
    // Check AuthState first
    if (AuthState.userId) {
      return AuthState.userId;
    }
    
    // Fallback to user's uid
    if (UserState.user?.uid) {
      return UserState.user.uid;
    }
    
    // Print auth state for debugging
    if (printUserId) {
      printUserId()(AuthState);
    }
    
    return null;
  };

  // Prefetch profile pictures for post author and commenters
  useEffect(() => {
    const prefetchPictures = async () => {
      try {
        if (!extractUsernames || !fetchProfilePictures) return;

        const commentUsernames = extractUsernames(safePost.comments || [], 'username');
        const authorUsername = safePost.username ? [safePost.username] : [];
        const allUsernames = [...new Set([...authorUsername, ...commentUsernames])];

        const toFetch = allUsernames.filter(u => u && !fetchedUsernames.current.has(u));
        if (toFetch.length > 0) {
          toFetch.forEach(u => fetchedUsernames.current.add(u));
          await fetchProfilePictures(toFetch);
        }
      } catch (error) {
        console.warn('ForumPostScreen: Error prefetching profile pictures', error);
      }
    };

    prefetchPictures();
  }, [safePost.username, safePost.comments, extractUsernames, fetchProfilePictures]);

  const handleAddComment = async () => {
    if (!comment.trim()) {
      return; // Don't add empty comments
    }
    
    const userId = getUserId();
    const username = UserState.user?.username || "Anonymous";
    
    console.log("Handling comment!"); 
    
    if (!userId) {
      Alert.alert(
        "Authentication Error", 
        "Could not identify your user account. Please log out and log back in.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      await addComment(safePost.postId, userId, username, comment);
      setComment(""); 
    } catch (err) {
      console.error("Error adding comment:", err);
      Alert.alert("Error", "Failed to add your comment. Please try again.");
    }
  };

  const handleLike = async () => {
    const userId = getUserId();
    
    if (!userId) {
      Alert.alert(
        "Authentication Error", 
        "Could not identify your user account. Please log out and log back in.",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      if (isLiked) {
        await unlikePost(safePost.postId, userId);
      } else {
        await likePost(safePost.postId, userId);
      }
    } catch (err) {
      console.error("Error updating like status:", err);
    }
  };

  const openUserProfile = (userId) => {
    setSelectedUserId(userId || safePost.userId); // Use post ID as fallback if no user ID
    setProfileModalVisible(true);
  };

  const canDelete = (() => {
    try {
      const authUserId = AuthState.userId || UserState.user?.uid;
      return authUserId && authUserId === safePost.userId;
    } catch {
      return false;
    }
  })();

  const handleDeletePost = async () => {
    try {
      if (!canDelete) return;
      
      Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await deletePost(safePost.postId);
              if (res?.success) {
                navigation.goBack();
              } else {
                Alert.alert('Delete Failed', res?.error || 'Unable to delete post');
              }
            } catch (e) {
              Alert.alert('Delete Failed', 'An unexpected error occurred');
            }
          }
        }
      ]);
    } catch (e) {
      Alert.alert('Delete Failed', 'An unexpected error occurred');
    }
  };

  const renderScrollContent = () => (
    <View style={styles.container}>
      {/* Main post container */}
      <View style={styles.postContainer}>
        {/* Post header with avatar */}
        <View style={styles.postHeader}>
          <TouchableOpacity onPress={() => openUserProfile(safePost.userId)}>
            <Image 
              source={{ 
                uri: (() => {
                  try {
                    const username = safePost.username;
                    const fallback = 'https://randomuser.me/api/portraits/lego/1.jpg';
                    const profileUrl = getProfilePictureUrlFor ? getProfilePictureUrlFor(username) : null;
                    // Prefer cached profile picture; fallback to post avatar; then default
                    return (profileUrl && profileUrl !== fallback) ? profileUrl : (safePost.avatar || fallback);
                  } catch (e) {
                    return 'https://randomuser.me/api/portraits/lego/1.jpg';
                  }
                })()
              }} 
              style={styles.avatar} 
              onError={(error) => {
                const username = safePost?.username || 'unknown';
                console.warn(`❌ Failed to load ForumPostScreen author avatar for ${username}:`, error.nativeEvent?.error);
              }}
            />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.username}>{safePost.username}</Text>
            <Text style={styles.postTime}>
              {(() => {
                try {
                  if (!safePost.createdAt) return "Unknown time";
                  
                  let timestamp;
                  
                  // Handle object with _seconds/_nanoseconds (new Firestore format)
                  if (safePost.createdAt._seconds !== undefined) {
                    timestamp = new Date(safePost.createdAt._seconds * 1000);
                  }
                  // Handle object with seconds/nanoseconds (old Firestore format)
                  else if (safePost.createdAt.seconds !== undefined) {
                    timestamp = new Date(safePost.createdAt.seconds * 1000);
                  }
                  // Handle string timestamp
                  else if (typeof safePost.createdAt === 'string') {
                    // Try to parse the string as a date
                    timestamp = new Date(safePost.createdAt);
                    
                    // If it's not a valid date, just return the string
                    if (isNaN(timestamp.getTime())) {
                      return safePost.createdAt;
                    }
                  }
                  // Handle numeric timestamp (unix epoch)
                  else if (typeof safePost.createdAt === 'number') {
                    // Assuming milliseconds if > 10^12, otherwise seconds
                    if (safePost.createdAt > 10000000000) {
                      timestamp = new Date(safePost.createdAt);
                    } else {
                      timestamp = new Date(safePost.createdAt * 1000);
                    }
                  }
                  
                  // If we have a valid timestamp, format it
                  if (timestamp && !isNaN(timestamp.getTime())) {
                    console.log("Valid timestamp:", timestamp.toString());
                    return format(timestamp, "PPpp");
                  }
                  
                  // Fallback to string representation or unknown
                  return String(safePost.createdAt) || "Unknown time";
                } catch (error) {
                  console.error("Error formatting post time:", error, JSON.stringify(safePost.createdAt));
                  return "Unknown time";
                }
              })()}
            </Text>
          </View>
          {canDelete && (
            <TouchableOpacity onPress={handleDeletePost} style={styles.postDeleteBtn}>
              <Ionicons name="trash-outline" size={moderateScale(20)} color={COLORS.lightGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Post content */}
        <PostContent content={safePost.content} tags={safePost.tags} />

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={moderateScale(20)} 
              color={isLiked ? COLORS.gradientPink : COLORS.white} 
            />
            <Text style={styles.actionText}>{likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={moderateScale(20)} color={COLORS.white} />
            <Text style={styles.actionText}>{safePost.comments.length}</Text>
          </TouchableOpacity> 
        </View>
      </View>

      {/* Comments section */}
      <HeightSpacer height={moderateScale(15)} /> 
      <Text style={styles.sectionTitle}>Comments ({safePost.comments.length})</Text>
      
      {safePost.comments.length === 0 ? (
        <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
      ) : (
        [...safePost.comments]
          .sort((a, b) => {
            // Sort comments by creation time - newest first
            const getTimestamp = (createdAt) => {
              if (!createdAt) return 0;
              if (createdAt._seconds) return createdAt._seconds * 1000;
              if (createdAt.seconds) return createdAt.seconds * 1000;
              if (typeof createdAt === 'number') return createdAt > 10000000000 ? createdAt : createdAt * 1000;
              return new Date(createdAt).getTime();
            };
            return getTimestamp(b.createdAt) - getTimestamp(a.createdAt);
          })
          .map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={comment}
              onAvatarPress={() => openUserProfile(comment.userId)}
              onLikeComment={likeComment}
              onUnlikeComment={unlikeComment}
              currentUserId={getUserId()}
              postId={safePost.postId}
              avatarPic={(() => {
                try {
                  const username = comment?.username;
                  const fallback = 'https://randomuser.me/api/portraits/lego/1.jpg';
                  const profileUrl = getProfilePictureUrlFor ? getProfilePictureUrlFor(username) : null;
                  return (profileUrl && profileUrl !== fallback) ? profileUrl : (comment?.avatar || fallback);
                } catch (e) {
                  return 'https://randomuser.me/api/portraits/lego/1.jpg';
                }
              })()}
            />
          ))
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 5 : 5}
    >
      <View style={styles.rootContainer}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={COLORS.backgroundPurple} 
          translucent={false} 
        />

        <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }}>
          <PostHeader onBack={() => navigation.goBack()} />

          <ScrollView
            style={{ flex: 1, backgroundColor: COLORS.backgroundPurple }}
            contentContainerStyle={{ flexGrow: 1 }}
            overScrollMode="never"
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderScrollContent()}
          </ScrollView>

          {/* Comment input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.lightGray}
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity 
              style={[
                styles.commentButton,
                !comment.trim() ? styles.commentButtonDisabled : null
              ]} 
              onPress={handleAddComment}
              disabled={!comment.trim()}
            >
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* User Profile Modal */}
        <UserProfileModal
          visible={profileModalVisible}
          onClose={() => setProfileModalVisible(false)}
          userId={selectedUserId}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = {
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPurple, 
  },
  container: {
    flex: 1,
    borderTopLeftRadius: moderateScale(25),
    borderTopRightRadius: moderateScale(25),
    backgroundColor: COLORS.darkBackground,
    paddingHorizontal: moderateScale(15)
  },
  postContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12), 
    padding: moderateScale(15),
    marginTop: verticalScale(15),
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  postDeleteBtn: {
    marginLeft: 'auto',
    padding: moderateScale(6),
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  postTime: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.cardDark,
    paddingTop: verticalScale(10),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginLeft: moderateScale(5),
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginBottom: verticalScale(15),
  },
  noCommentsText: {
    color: COLORS.lightGray,
    textAlign: "center",
    fontSize: moderateScale(14),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(20),
    fontStyle: "italic",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: moderateScale(10),
    backgroundColor: COLORS.cardDark,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginRight: moderateScale(10),
  },
  commentButton: {
    backgroundColor: COLORS.gradientPink,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: verticalScale(10),
  },
  commentButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  commentButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
};

export default ForumPostScreen;