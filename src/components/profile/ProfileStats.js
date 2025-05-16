import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const ProfileStats = ({ user }) => {
  // Calculate number of unlocked achievements
  const achievementCount = Object.keys(user?.achievements || {})
    .filter(key => user?.achievements[key]?.unlocked).length;
    
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{user?.streaks || 0}</Text>
        <Text style={styles.statLabel}>Day Streak</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{user?.physioSessions || 0}</Text>
        <Text style={styles.statLabel}>Sessions</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{achievementCount}</Text>
        <Text style={styles.statLabel}>Achievements</Text>
      </View>
    </View>
  );
};

export default ProfileStats;

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(15),
    paddingHorizontal: moderateScale(15),
    width: '100%',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  statLabel: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}); 