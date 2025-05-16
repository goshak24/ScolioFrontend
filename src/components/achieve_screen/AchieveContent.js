import { StyleSheet, Text, View, FlatList, Platform } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import ReusableButton from '../reusable/ReusableButton'; 
import moment from 'moment';
import HeightSpacer from '../reusable/HeightSpacer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';
import { Context as PreSurgeryContext } from '../../context/PreSurgeryContext';

// Storage keys
const POSTSURGERY_TASKS_KEY = 'recoveryTasks';
const WALKING_MINUTES_KEY = 'walkingMinutes';

const AchieveContent = ({ activeTab, streakDays, physioSessions, achievements, user }) => { 
  // State for surgery task data
  const [surgeryTasks, setSurgeryTasks] = useState({
    completed: 0,
    total: 0
  });
  const [walkingMinutes, setWalkingMinutes] = useState(0);

  // --- SURGERY CONTEXTS HOOKUP ---
  const postSurgCtx = useContext(PostSurgeryContext);
  const preSurgCtx = useContext(PreSurgeryContext);
  const accountType = user?.acc_type?.toLowerCase() || 'brace + physio';
  const isPreSurgery = accountType === 'presurgery' || accountType === 'pre-surgery';
  const isPostSurgery = accountType === 'postsurgery' || accountType === 'post-surgery';

  // --- Update surgery tasks and walking minutes from context (post-surgery) ---
  useEffect(() => {
    if (isPostSurgery && postSurgCtx?.state?.recoveryTasks) {
      setSurgeryTasks({
        completed: postSurgCtx.state.recoveryTasks.filter(task => task.completed).length,
        total: postSurgCtx.state.recoveryTasks.length
      });
      setWalkingMinutes(postSurgCtx.state.walkingMinutes || 0);
    }
  }, [isPostSurgery, postSurgCtx.state.recoveryTasks, postSurgCtx.state.walkingMinutes]);

  // --- Update surgery tasks from context (pre-surgery) ---
  useEffect(() => {
    if (isPreSurgery && preSurgCtx?.state?.checklistItems) {
      setSurgeryTasks({
        completed: preSurgCtx.state.checklistItems.filter(task => task.completed).length,
        total: preSurgCtx.state.checklistItems.length
      });
    }
  }, [isPreSurgery, preSurgCtx.state.checklistItems]);

  // --- Surgery Data Loaders ---
  const updateFromAsyncStorage = async () => {
    try {
      // Only need this for post-surgery now, as pre-surgery uses context
      if (isPostSurgery) {
        const savedTasksJSON = await AsyncStorage.getItem(POSTSURGERY_TASKS_KEY);
        const recoveryTasks = savedTasksJSON ? JSON.parse(savedTasksJSON) : [];
        setSurgeryTasks({
          completed: recoveryTasks.filter(task => task.completed).length,
          total: recoveryTasks.length,
        });
        const savedWalkingMinutes = await AsyncStorage.getItem(WALKING_MINUTES_KEY);
        setWalkingMinutes(savedWalkingMinutes ? Number(savedWalkingMinutes) : 0);
      }
    } catch (error) {
      console.error('Error loading surgery data for achievements:', error);
    }
  };

  // --- Load initial data ---
  useEffect(() => {
    // Load pre-surgery data from context
    if (isPreSurgery) {
      preSurgCtx.loadPreSurgeryData();
    } 
    // For post-surgery, check if context data exists, otherwise use AsyncStorage
    else if (isPostSurgery && !postSurgCtx?.state?.recoveryTasks?.length) {
      updateFromAsyncStorage();
    }
  }, [accountType]);

  // Generate an array of 7 days with active days logic
  // If streak is a multiple of 7, all days are active
  // Otherwise, mark first (streakDays % 7) days as active
  const activeDays = Array(7)
    .fill(false)
    .map((_, index) => {
      if (streakDays % 7 === 0 && streakDays > 0) {
        // If streak is exactly a multiple of 7 (7, 14, 21, etc.), light up all days
        return true;
      } else {
        // Otherwise, light up (streak % 7) days
        return index < (streakDays % 7);
      }
    });

  const points = 2850; 
  // Parse Achievements from AuthState
  const earnedBadges = Object.entries(achievements || {})
   .filter(([key, achievement]) => achievement.unlocked)
   .map(([key, achievement]) => ({
     id: key,
     name: key.replace(/_/g, ' '), 
     description: achievement.message,
     date: moment(achievement.date).format('MMM DD, YYYY'), // Format date
  })); 

  // Static data need to subtract earned badges from all badges 
  const unearnedBadges = [
    { id: '3', name: 'Ultimate Achiever', description: 'Complete all achievements' },
    { id: '4', name: 'Legend', description: 'Reach top 1% leaderboard' },
  ]; 

  // Get progress metrics based on account type
  const getProgressMetrics = () => {
    // Default metrics always shown
    const metrics = [
      // Streak is shown for all account types
      { id: 'streak', label: 'Streak Days', value: streakDays || 0, max: 7, icon: 'flame' }
    ];
    // Add type-specific metrics
    switch (accountType) {
      case 'brace':
        return [
          ...metrics,
          { id: 'brace', label: 'Brace Hours', value: user?.treatmentData?.brace?.weeklyHours || 68, max: 112, icon: 'time' },
          { id: 'pain', label: 'Pain Logs', value: user?.treatmentData?.painLogs?.count || 6, max: 7, icon: 'medical' }
        ];
      case 'physio':
        return [
          ...metrics,
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: 5, icon: 'fitness' },
          { id: 'pain', label: 'Pain Logs', value: user?.treatmentData?.painLogs?.count || 6, max: 7, icon: 'medical' }
        ];
      case 'brace + physio':
        return [
          ...metrics,
          { id: 'brace', label: 'Brace Hours', value: user?.treatmentData?.brace?.weeklyHours || 68, max: 112, icon: 'time' },
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: 5, icon: 'fitness' },
          { id: 'pain', label: 'Pain Logs', value: user?.treatmentData?.painLogs?.count || 6, max: 7, icon: 'medical' }
        ];
      case 'presurgery':
      case 'pre-surgery':
        return [
          ...metrics,
          { id: 'tasks', label: 'Prep Tasks Completed', value: surgeryTasks.completed || 0, max: surgeryTasks.total || 6, icon: 'checkbox' },
          { id: 'appointments', label: 'Appointments Attended', value: user?.treatmentData?.appointments?.attended || 3, max: user?.treatmentData?.appointments?.total || 4, icon: 'calendar' }
        ];
      case 'postsurgery':
      case 'post-surgery':
        return [
          ...metrics,
          { id: 'recovery', label: 'Recovery Tasks', value: surgeryTasks.completed || 0, max: surgeryTasks.total || 5, icon: 'checkbox' },
          { id: 'walking', label: 'Daily Walking (min)', value: walkingMinutes || 0, max: 30, icon: 'walk' }
        ];
      default:
        return [
          ...metrics,
          { id: 'brace', label: 'Brace Hours', value: user?.treatmentData?.brace?.weeklyHours || 68, max: 112, icon: 'time' },
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: 5, icon: 'fitness' }
        ];
    }
  };

  // Get progress data specific to user's account type
  const progressData = getProgressMetrics();

  // Get icon for progress item
  const getProgressIcon = (iconName) => {
    switch (iconName) {
      case 'flame': return 'flame';
      case 'time': return 'time-outline';
      case 'fitness': return 'fitness-outline';
      case 'medical': return 'medical-outline'; 
      case 'checkbox': return 'checkbox-outline';
      case 'calendar': return 'calendar-outline';
      case 'walk': return 'walk-outline';
      default: return 'stats-chart-outline';
    }
  };

  return (
    <View style={styles.container}>
      {activeTab === 'badges' && (
        <View>
          {/* Unearned Badges Section */}
          <View style={styles.section}>
            <View style={styles.header}>
              <Ionicons name="star-outline" size={moderateScale(18)} color={COLORS.tabInactive} />
              <Text style={styles.headerText}>Badges to Earn</Text>
              <View style={{width: moderateScale(18)}}></View>
            </View>
            <FlatList
              data={unearnedBadges}
              keyExtractor={(item) => item.id}
              numColumns={2}
              overScrollMode="never"
              bounces={false}
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

          {/* Earned Badges Section */}
          <View style={styles.section}>
            <View style={styles.header}>
              <Ionicons name="trophy" size={moderateScale(18)} color={COLORS.tabActiveStart} />
              <Text style={styles.headerText}>Earned Badges</Text>
              <View style={{width: moderateScale(18)}}></View>
            </View>
            <FlatList
              data={earnedBadges}
              keyExtractor={(item) => item.id}
              overScrollMode="never"
              bounces={false}
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
        </View>
      )}

      {activeTab === 'progress' && (
        <View>
          {/* Weekly Progress Section */}
          <View style={styles.section}>
            <View style={styles.header}>
              <Ionicons name="calendar" size={moderateScale(18)} color={COLORS.tabActiveStart} />
              <Text style={styles.headerText}>Weekly Progress</Text>
            </View>

            {progressData.map((item) => {
              const progress = item.max && item.value ? item.value / item.max : 0;

              return (
                <View key={item.id} style={styles.progressItem}>
                  <View style={styles.progressLabelContainer}>
                    <Ionicons name={getProgressIcon(item.icon)} size={moderateScale(16)} color={COLORS.tabActiveStart} style={styles.progressIcon} />
                    <Text style={styles.progressLabel}>
                      {item.label} <Text style={styles.progressValue}>{item.value}/{item.max}</Text>
                    </Text>
                  </View>
                  <ProgressBar progress={progress} color={COLORS.gradientPurple} style={styles.progressBar} />
                </View>
              ); 
            })} 
          </View>

          {/* Streak Section */}
          <View style={styles.section}>
            <View style={styles.headerCentered}> 
              <Ionicons name="flame" size={moderateScale(22)} color={COLORS.streakOrange} />
              <Text style={styles.headerTextCentered}>Your Streak</Text>
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{streakDays} days</Text>
              </View>
            </View>

            <View style={styles.streakContainer}>
              {activeDays.map((active, index) => (
                <View key={index} style={[styles.streakDay, active ? styles.streakActive : styles.streakInactive]}>
                  <Ionicons 
                    name="flame" 
                    size={moderateScale(20)} 
                    color={active ? COLORS.streakOrange : COLORS.darkGray} 
                  />
                </View>
              ))}
            </View>

            <Text style={styles.streakInfo}>
              {streakDays % 7 === 0 && streakDays > 0 
                ? `Great job! You've completed ${streakDays / 7} full weeks!` 
                : 'Keep your streak going! Complete your daily tasks to maintain it.'}
            </Text>
          </View>
        </View>
      )}

      {activeTab === 'rewards' && (
        <View style={styles.section}>
          <View style={styles.header}>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
              <Ionicons name="flame" size={moderateScale(18)} color={COLORS.tabActiveStart} />
              <Text style={[styles.headerText, {marginLeft: moderateScale(5)}]}>Your Points</Text>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.streakText}>{points} Points</Text>
            </View>
          </View>

          <Text style={styles.badgeDescription}>Use your points to unlock special rewards and features!</Text> 

          <HeightSpacer height={moderateScale(5)} /> 

          <ReusableButton 
            onPress={() => console.log("Earn More Points Pressed!")} 
            btnText="Earn More Points"
            textColor="#FFFFFF" 
            width="100%" 
            borderWidth={0} 
            borderRadius={moderateScale(8)} 
            borderColor="transparent"
          /> 

        </View>
      )} 
    </View>
  );
};

export default AchieveContent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(10),
    marginTop: moderateScale(5), 
    backgroundColor: COLORS.darkBackground,
  },
  section: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(15),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(12),
  },
  headerCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(15),
    paddingVertical: moderateScale(5),
  },
  headerText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerTextCentered: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginHorizontal: moderateScale(10),
  },
  badgeCard: {
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    margin: moderateScale(5),
    alignItems: 'center',
    justifyContent: 'space-between', 
    flex: 1,
  },
  badgeIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.primaryPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  unearnedBadgeIcon: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: COLORS.badgeBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(6),
  },
  badgeTitle: {
    fontWeight: 'bold',
    color: COLORS.white,
    fontSize: moderateScale(13),
    marginBottom: moderateScale(2),
  },
  badgeDescription: {
    fontSize: moderateScale(11),
    color: COLORS.lightGray,
    textAlign: 'center',
    marginBottom: moderateScale(5),
  },
  badgeDate: {
    fontSize: moderateScale(10),
    color: COLORS.tabActiveStart,
  },
  progressItem: {
    marginBottom: moderateScale(10),
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  progressIcon: {
    marginRight: moderateScale(6),
  },
  progressLabel: {
    fontSize: moderateScale(13),
    color: COLORS.white,
  },
  progressValue: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  progressBar: {
    height: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.progressBackground,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
    paddingHorizontal: moderateScale(Platform.OS === 'ios' ? 10 : 5),
  },
  streakDay: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: scale(2),
  },
  streakActive: {
    backgroundColor: COLORS.streakActive || '#4d2f87',
  },
  streakInactive: {
    backgroundColor: COLORS.streakInactive || '#1c1c24',
  },
  streakBadge: {
    backgroundColor: COLORS.streakOrange,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(15),
    minWidth: moderateScale(70),
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  streakInfo: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    textAlign: 'center',
    paddingHorizontal: moderateScale(5),
  },
  pointsBadge: {
    backgroundColor: COLORS.primaryPurple,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(10),
  },
});