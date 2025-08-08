import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const RecentActivity = ({ items = [] }) => {
  const data = items.slice(0,4);
  return (
    <View style={styles.cardBlock}>
      <Text style={styles.sectionHeader}>Recent Activity</Text>
      <View style={styles.activityCard}>
        {data.length === 0 ? (
          <View style={styles.activityRow}>
            <View style={styles.activityIconWrap}>
              <Ionicons name="information-circle" size={18} color={COLORS.lightGray} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityName}>No recent activity</Text>
            </View>
          </View>
        ) : (
          data.map((item, idx) => (
            <View key={idx} style={styles.activityRow}>
              <View style={styles.activityIconWrap}>
                <Ionicons name={item.icon} size={18} color={COLORS.lightGray} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityName}>{item.name}</Text>
                {!!item.time && <Text style={styles.activityTime}>{item.time}</Text>}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8)
  },
  cardBlock: {
    marginTop: moderateScale(14)
  },
  activityCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12)
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(6)
  },
  activityIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10)
  },
  activityName: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    fontWeight: '500'
  },
  activityTime: {
    color: COLORS.text,
    fontSize: moderateScale(11)
  }
});

export default RecentActivity;

