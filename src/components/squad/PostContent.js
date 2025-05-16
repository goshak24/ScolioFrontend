import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from "react-native-size-matters";
import COLORS from "../../constants/COLORS";

const PostContent = ({ content, tags }) => (
  <View style={styles.contentContainer}>
    <Text style={styles.postContent}>{content}</Text>
    {tags.length > 0 && (
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: verticalScale(8),
  },
  postContent: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(10),
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: verticalScale(10),
  },
  tag: {
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(15),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    marginRight: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  tagText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '500',
  }
});

export default PostContent;