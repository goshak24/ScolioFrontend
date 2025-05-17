import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const ActivityTags = ({ activities }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Activities</Text>
      <View style={styles.tagsContainer}>
        {activities.map((activity, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{activity}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ActivityTags;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(10),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: moderateScale(8),
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: moderateScale(-3),
  },
  tag: {
    backgroundColor: '#1F2937',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(15),
    marginRight: moderateScale(6),
    marginBottom: moderateScale(6),
  },
  tagText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
});
