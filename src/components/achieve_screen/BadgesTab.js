import { StyleSheet, Text, View, FlatList } from 'react-native';
import React, { useContext } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import { Context as AuthContext } from '../../context/AuthContext'; 

const BadgesTab = () => {
  const { state: AuthState } = useContext(AuthContext);

  const earnedBadges = Object.entries(AuthState.user.achievements || {})
    .filter(([_, achievement]) => achievement.unlocked)
    .map(([key, achievement]) => ({
      id: key,
      name: key.replace(/_/g, ' '),
      description: achievement.message,
      date: achievement.date,
    }));

  const unearnedBadges = [
    { id: '3', name: 'Ultimate Achiever', description: 'Complete all achievements' },
    { id: '4', name: 'Legend', description: 'Reach top 1% leaderboard' },
  ];

  return (
    <View style={styles.container}>
      {/* Earned Badges Section */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={moderateScale(18)} color={COLORS.tabActiveStart} />
          <Text style={styles.headerText}>Earned Badges</Text>
          <View style={{ width: moderateScale(18) }}></View>
        </View>
        <FlatList
          data={earnedBadges}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Ionicons name="trophy" size={moderateScale(28)} color="white" />
              </View>
              <Text style={styles.badgeTitle}>{item.name}</Text>
              <Text style={styles.badgeDescription}>{item.description}</Text>
              <Text style={styles.badgeDate}>Earned {item.date}</Text>
            </View>
          )}
        />
      </View>

      {/* Unearned Badges Section */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Ionicons name="star-outline" size={moderateScale(18)} color={COLORS.tabInactive} />
          <Text style={styles.headerText}>Badges to Earn</Text>
          <View style={{ width: moderateScale(18) }}></View>
        </View>
        <FlatList
          data={unearnedBadges}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.badgeCard}>
              <View style={styles.unearnedBadgeIcon}>
                <Ionicons name="trophy-outline" size={moderateScale(28)} color={COLORS.lightGray} />
              </View>
              <Text style={styles.badgeTitle}>{item.name}</Text>
              <Text style={styles.badgeDescription}>{item.description}</Text>
            </View>
          )}
        />
      </View>
    </View>
  );
};

export default BadgesTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
    backgroundColor: COLORS.darkBackground,
  },
  section: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  headerText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  badgeCard: {
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    margin: moderateScale(5),
    alignItems: 'center',
    flex: 1,
  },
  badgeIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.primaryPurple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unearnedBadgeIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.badgeBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeTitle: {
    fontWeight: 'bold',
    color: COLORS.white,
    fontSize: moderateScale(13),
  },
  badgeDescription: {
    fontSize: moderateScale(11),
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  badgeDate: {
    fontSize: moderateScale(10),
    color: COLORS.tabActiveStart,
  },
}); 