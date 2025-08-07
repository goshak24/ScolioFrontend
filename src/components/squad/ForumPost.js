import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { format } from "date-fns";  
import COLORS from "../../constants/COLORS";
import HeightSpacer from "../reusable/HeightSpacer";
import useProfilePictures from "../../hooks/useProfilePictures";

const ForumPost = ({ 
  post,
  navigation,
  onAvatarPress
}) => {
  const { getProfilePictureUrlFor } = useProfilePictures();
  // Extract post properties with defaults for safety
  const {
    id,
    content = "No content available.", 
    title = "Untitled Post", 
    tags = [], 
    username = "Anonymous", 
    userId,
    createdAt,
    comments = [],
    likes = [],
    avatar = "https://randomuser.me/api/portraits/lego/1.jpg"
  } = post || {};
  
  // Handle formatted time display
  const getFormattedTime = () => {
    try {
      if (!createdAt) return "Unknown date";
      
      // If createdAt is already a formatted string
      if (typeof createdAt === 'string') {
        // Try to clean it up for display if needed
        const parts = createdAt.split(',');
        if (parts.length > 1) {
          return parts[0] + ' ' + parts[1];
        }
        return createdAt;
      }
      
      // Handle object with _seconds/_nanoseconds (new Firestore format)
      if (createdAt._seconds !== undefined) {
        const date = new Date(createdAt._seconds * 1000);
        return format(date, "MMM d, h:mm a");
      }
      
      // Handle object with seconds/nanoseconds (old Firestore format)
      if (createdAt.seconds !== undefined) {
        const date = new Date(createdAt.seconds * 1000);
        return format(date, "MMM d, h:mm a");
      }
      
      // Handle numeric timestamp (unix epoch)
      if (typeof createdAt === 'number') {
        // Assuming milliseconds if > 10^12, otherwise seconds
        if (createdAt > 10000000000) {
          return format(new Date(createdAt), "MMM d, h:mm a");
        } else {
          return format(new Date(createdAt * 1000), "MMM d, h:mm a");
        }
      }
      
      // Fallback
      return "Unknown date";
    } catch (error) {
      console.error("Error formatting time in ForumPost:", error);
      return "Unknown date";
    }
  };

  const handleAvatarPress = () => {
    if (onAvatarPress && userId) {
      onAvatarPress(userId);
    }
  };
  
  const navigateToPostDetails = () => {
    if (navigation && id) {
      navigation.navigate("ForumPostScreen", { post });
    }
  };

  return (
    <TouchableOpacity onPress={navigateToPostDetails} style={styles.postCard}>
      <Text style={styles.postTitle}>{title}</Text>

      {/* Content */}
      <Text 
        style={styles.postDescription}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {content}
      </Text> 

      {/* Tags & Comments Row */}
      <View style={styles.row}>
        {/* Tags */}
        <View style={styles.tagContainer}>
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <Text key={index} style={styles.tag}>{tag}</Text>
            ))
          ) : (
            <Text style={styles.noTags}>No Tags</Text>
          )}
        </View>
        
        {/* Comments & Likes Count */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsItem}>💬 {comments.length}</Text>
          <Text style={styles.statsItem}>❤️ {likes.length}</Text>
        </View>
      </View>

      <HeightSpacer height={moderateScale(5)} />

      {/* User Info */}
      <View style={styles.userRow}>
        <TouchableOpacity onPress={handleAvatarPress}>
          <Image 
            source={{ 
              uri: (() => {
                // Ensure username exists before processing
                if (!username || typeof username !== 'string') {
                  console.warn(`⚠️ ForumPost: Invalid username:`, username);
                  return 'https://randomuser.me/api/portraits/lego/1.jpg';
                }
                
                // Try to get profile picture from cache first
                const profilePictureUrl = getProfilePictureUrlFor ? getProfilePictureUrlFor(username) : null;
                
                // Priority: cached profile picture > post avatar > fallback
                const finalUrl = profilePictureUrl && profilePictureUrl !== 'https://randomuser.me/api/portraits/lego/1.jpg' 
                  ? profilePictureUrl 
                  : avatar; 
                
                return finalUrl;
              })()
            }} 
            style={styles.avatar}
            onError={(error) => console.warn(`❌ Failed to load ForumPost avatar for ${username || 'unknown'}:`, error.nativeEvent.error)}
          />
        </TouchableOpacity>
        <View style={styles.userInfoContainer}>
          <Text style={styles.username}>{username}</Text> 
        </View>
        <Text style={styles.time}>{getFormattedTime()}</Text>
      </View>
      
    </TouchableOpacity>
  );
};

export default ForumPost;

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  postTitle: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  postDescription: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginVertical: moderateScale(5),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "60%",
  },
  tag: {
    backgroundColor: COLORS.badgeBackground,
    color: COLORS.white,
    fontSize: moderateScale(10),
    padding: moderateScale(5),
    marginTop: moderateScale(5),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(5),
  },
  noTags: {
    color: COLORS.lightGray,
    fontSize: moderateScale(10),
    fontStyle: "italic",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(5),
  },
  avatar: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(8),
    backgroundColor: COLORS.cardDark, // Add background color for debugging
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    color: COLORS.gradientPink,
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
  userTitle: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginLeft: moderateScale(5),
  },
  time: {
    color: COLORS.lightGray,
    fontSize: moderateScale(10),
    marginLeft: "auto",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  statsItem: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginLeft: moderateScale(10),
    marginTop: moderateScale(5)
  },
}); 