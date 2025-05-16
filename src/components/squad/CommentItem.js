import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { moderateScale, verticalScale } from "react-native-size-matters";
import COLORS from "../../constants/COLORS";
import { format } from "date-fns";

const CommentItem = ({ comment, onAvatarPress }) => {
  // Handle different timestamp formats
  const formatTimestamp = () => {
    try {
      if (!comment || !comment.createdAt) {
        return "Just now";
      }
      
      console.log("Comment timestamp:", JSON.stringify(comment.createdAt));
      
      let timestamp;
      
      // Handle object with _seconds/_nanoseconds (new Firestore format)
      if (comment.createdAt._seconds !== undefined) {
        timestamp = new Date(comment.createdAt._seconds * 1000);
      }
      // Handle object with seconds/nanoseconds (old Firestore format)
      else if (comment.createdAt.seconds !== undefined) {
        timestamp = new Date(comment.createdAt.seconds * 1000);
      }
      // Handle string timestamp
      else if (typeof comment.createdAt === 'string') {
        // Try to parse the string as a date
        timestamp = new Date(comment.createdAt);
        
        // If it's not a valid date, just return the string
        if (isNaN(timestamp.getTime())) {
          return comment.createdAt;
        }
      }
      // Handle numeric timestamp (unix epoch)
      else if (typeof comment.createdAt === 'number') {
        // Assuming milliseconds if > 10^12, otherwise seconds
        if (comment.createdAt > 10000000000) {
          timestamp = new Date(comment.createdAt);
        } else {
          timestamp = new Date(comment.createdAt * 1000);
        }
      }
      
      // If we have a valid timestamp, format it
      if (timestamp && !isNaN(timestamp.getTime())) {
        return format(timestamp, "PPpp");
      }
      
      // Fallback to string representation or "Just now"
      return String(comment.createdAt) || "Just now";
    } catch (error) {
      console.error("Error formatting timestamp:", error, JSON.stringify(comment?.createdAt));
      return "Just now";
    }
  };

  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <TouchableOpacity onPress={onAvatarPress}>
          <Image 
            source={{ uri: comment.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }} 
            style={styles.commentAvatar} 
          />
        </TouchableOpacity>
        <View style={styles.commentUserInfo}>
          <Text style={styles.commentUsername}>{comment.username}</Text> 
          <Text style={styles.commentTime}>{formatTimestamp()}</Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.commentActionButton}>
          <Ionicons name="heart-outline" size={moderateScale(16)} color={COLORS.white} />
          <Text style={styles.commentActionText}>{comment.likesCount || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  commentContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(10),
  },
  commentAvatar: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    marginRight: moderateScale(10),
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUsername: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: "bold",
  },
  commentTime: {
    color: COLORS.lightGray,
    fontSize: moderateScale(10),
  },
  commentContent: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    marginBottom: verticalScale(10),
  },
  commentActions: {
    flexDirection: "row",
  },
  commentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: moderateScale(15),
  },
  commentActionText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    marginLeft: moderateScale(5),
  },
});

export default CommentItem;