import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { format } from "date-fns";  
import COLORS from "../../constants/COLORS";
import HeightSpacer from "../reusable/HeightSpacer";

const ForumPost = ({ 
  content, 
  title, 
  tags = [], 
  username, 
  userTitle = "Member", 
  createdAt, 
  comments,
  avatar = "https://randomuser.me/api/portraits/lego/1.jpg",
  userId,
  onAvatarPress
}) => {

  // Handle formatted time display
  const getFormattedTime = () => {
    try {
      // If createdAt is already a formatted string
      if (typeof createdAt === 'string') {
        // Try to clean it up for display if needed
        const parts = createdAt.split(',');
        if (parts.length > 1) {
          return parts[0] + ' ' + parts[1];
        }
        return createdAt;
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

  return (
    <View style={styles.postCard}>
      <Text style={styles.postTitle}>{title || "Untitled Post"}</Text>

      {/* Content */}
      <Text style={styles.postDescription}>{content || "No content available."}</Text> 

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
        
        {/* Comments Count */}
        <Text style={styles.commentCount}>💬 {comments.length}</Text>
      </View>

      <HeightSpacer height={moderateScale(5)} />

      {/* User Info */}
      <View style={styles.userRow}>
        <TouchableOpacity onPress={handleAvatarPress}>
          <Image 
            source={{ uri: avatar }} 
            style={styles.avatar} 
          />
        </TouchableOpacity>
        <View style={styles.userInfoContainer}>
          <Text style={styles.username}>{username || "Anonymous"}</Text>
          <Text style={styles.userTitle}>• {userTitle}</Text>
        </View>
        <Text style={styles.time}>{getFormattedTime()}</Text>
      </View>
      
    </View>
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
  commentCount: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    textAlign: "right",
    marginTop: moderateScale(5)
  },
}); 