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
import { Context as ActivityContext } from '../../context/ActivityContext';

// Storage keys
const POSTSURGERY_TASKS_KEY = 'recoveryTasks';
const WALKING_MINUTES_KEY = 'walkingMinutes';

// All available badges from the controller
const availableBadges = [
  //{ id: '1', name: 'Ultimate Achiever', description: 'Complete all achievements' },
  //{ id: '2', name: 'Legend', description: 'Reach top 1% leaderboard' },

  // 🦴 Brace Adherence
  { id: '3', name: 'Brace Starter', description: 'Wore your brace for the first time' },
  //{ id: '4', name: 'Brace Boss', description: 'Wore your brace daily for 7 days straight' },
  //{ id: '5', name: 'Aligned & Strong', description: 'Completed your first full week wearing the brace as prescribed' },
  { id: '6', name: 'Support Squad', description: 'Scanned or logged brace usage 10 times' },
  //{ id: '7', name: 'Posture Pro', description: 'Great posture and brace usage for 14 days!' },
  //{ id: '8', name: 'Brace & Win', description: '30-day streak with your brace - commitment pays off' },

  // 🧘 Physio Therapy
  { id: '9', name: 'Stretch Starter', description: 'First log, committed to moving better!' },
  { id: '10', name: 'Motion Master', description: 'Completed 5 movement therapy sessions' },
  //{ id: '11', name: 'Therapy Trailblazer', description: 'Completed 10 unique physio routines' },
  //{ id: '12', name: 'Pain Slayer', description: 'Logged progress on pain reduction over 2 weeks' },
  //{ id: '13', name: 'Recovery Ritualist', description: 'Checked in with physio tracker for 14 days straight' },
  //{ id: '14', name: 'Move to Heal', description: 'Hit a 30-day rehab streak - wow!' },

  // 💬 Community / Messaging
  { id: '15', name: 'First Voice', description: 'Posted your first post in the forum' },
  { id: '16', name: 'Circle Builder', description: 'Replied to 5 others posts with kindness or tips' },
  { id: '17', name: 'Uplifter', description: 'Gave 10+ upvotes or reactions to community posts' },
  //{ id: '18', name: 'Community Guide', description: 'Answered someones question with helpful advice' },
  { id: '19', name: 'Kindred Spirit', description: 'Supported a fellow user via private messaging' },

  // 💡 Bonus
  // id: '20', name: 'Nudge Ninja', description: 'Responded to in-app nudge 10+ times' },
  //{ id: '21', name: 'Progress Tracker', description: 'Logged daily recovery score for 14 days' },
  //{ id: '22', name: 'Realign Rebel', description: 'Broke through a recovery plateau with consistency' },
  //{ id: '23', name: 'Milestone Maven', description: 'Hit all weekly goals 3 weeks in a row' },
  //{ id: '24', name: 'Hope Holder', description: 'Shared a positive message with others in recovery' },
];

// Helper: filter badges relevant to the user's account type
// Account types supported: 'brace', 'physio', 'brace + physio', 'pre-surgery'/'presurgery', 'post-surgery'/'postsurgery'
const filterBadgesByAccountType = (allBadges, accountType, isPostSurgery) => {
  const normalizedType = (accountType || '').toLowerCase();

  const braceBadgeIds = new Set(['3', '4', '5', '6', '7', '8']);
  const physioBadgeIds = new Set(['9', '10', '11', '12', '13', '14']);
  const communityBadgeIds = new Set(['15', '16', '17', '18', '19']);
  const generalBadgeIds = new Set(['1', '20', '22', '24']);

  const includesBrace = normalizedType === 'brace' || normalizedType === 'brace + physio';
  const includesPhysio =
    normalizedType === 'physio' ||
    normalizedType === 'brace + physio' ||
    normalizedType === 'post-surgery' ||
    normalizedType === 'postsurgery' ||
    isPostSurgery === true;

  return allBadges.filter((badge) => {
    const id = badge.id;
    if (generalBadgeIds.has(id)) return true; // always relevant
    if (communityBadgeIds.has(id)) return true; // community is relevant to all
    if (braceBadgeIds.has(id)) return includesBrace; // brace-specific
    if (physioBadgeIds.has(id)) return includesPhysio; // physio-specific
    return true;
  });
};

const AchieveContent = ({ activeTab, streakDays, physioSessions, achievements, user, weeklyExpectedSessions }) => { 
  // State for surgery task data
  const [surgeryTasks, setSurgeryTasks] = useState({
    completed: 0,
    total: 0
  });
  const [walkingMinutes, setWalkingMinutes] = useState(0);
  const [braceWornThisWeek, setBraceWornThisWeek] = useState(0);
  const [showAllUnearnedBadges, setShowAllUnearnedBadges] = useState(false);
  
  // Get activity context for real-time brace data updates
  const { state: activityState, fetchActivityData } = useContext(ActivityContext); 
  
  // --- SURGERY CONTEXTS HOOKUP ---
  const postSurgCtx = useContext(PostSurgeryContext);
  const preSurgCtx = useContext(PreSurgeryContext);
  const accountType = user?.acc_type?.toLowerCase() || 'brace + physio';
  const isPreSurgery = accountType === 'presurgery' || accountType === 'pre-surgery';
  const isPostSurgery = accountType === 'postsurgery' || accountType === 'post-surgery';

  const calculateBraceTimeThisWeek = () => {
    // Get the start of the current week (Monday)
    const startOfWeek = moment().startOf('isoWeek'); // ISO week starts on Monday
    const endOfWeek = moment().endOf('isoWeek');
    
    let totalHours = 0;
    
    // First try to get data from activity context for real-time updates
    if (activityState?.braceData) {
      Object.entries(activityState.braceData).forEach(([dateString, hours]) => {
        const date = moment(dateString);
        
        // Check if the date falls within this week
        if (date.isBetween(startOfWeek, endOfWeek, null, '[]')) {
          totalHours += hours;
        }
      });
    }
    
    // If no data from activity context, fall back to user data
    if (totalHours === 0 && user?.treatmentData?.brace?.wearingHistory) {
      const wearingHistory = user.treatmentData.brace.wearingHistory;
      
      // Iterate through the wearing history
      Object.entries(wearingHistory).forEach(([dateString, hours]) => {
        const date = moment(dateString);
        
        // Check if the date falls within this week
        if (date.isBetween(startOfWeek, endOfWeek, null, '[]')) {
          totalHours += hours;
        }
      });
    }

    return Math.round(totalHours * 100) / 100; 
  };
  
  // Update brace worn this week whenever activity state changes
  useEffect(() => {
    setBraceWornThisWeek(calculateBraceTimeThisWeek());
  }, [activityState, user?.treatmentData?.brace?.wearingHistory]);
  
  // Fetch activity data on component mount and when accountType changes
  useEffect(() => {
    if (accountType === 'brace' || accountType === 'brace + physio') {
      fetchActivityData();
    }
  }, [accountType]);

  const braceTimeRequiredThisWeek = (user?.treatmentData?.brace?.wearingSchedule)*7;

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

  // Parse Achievements from AuthState and create earned badges
  const earnedBadges = Object.entries(achievements || {}) 
   .map(([key, achievement]) => ({
     id: key,
     name: achievement.name, 
     description: achievement.description,
     date: moment(achievement.earnedAt).format('MMM DD, YYYY'), 
   })); 

  // Get earned badge IDs for filtering
  const earnedBadgeIds = earnedBadges.map(badge => badge.id);

  // Filter available badges to only those relevant to the user's account type
  const filteredAvailableBadges = filterBadgesByAccountType(availableBadges, accountType, isPostSurgery);

  // Filter relevant badges to get unearned badges
  const unearnedBadges = filteredAvailableBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

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
          { id: 'brace', label: 'Brace Hours', value: braceWornThisWeek || 0, max: braceTimeRequiredThisWeek, icon: 'time' },
          { id: 'pain', label: 'Pain Logs', value: user?.treatmentData?.painLogs?.count || 6, max: 7, icon: 'medical' }
        ];
      case 'physio':
        return [
          ...metrics,
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: weeklyExpectedSessions, icon: 'fitness' },
          { id: 'pain', label: 'Pain Logs', value: user?.treatmentData?.painLogs?.count || 6, max: 7, icon: 'medical' }
        ];
      case 'brace + physio':
        return [
          ...metrics,
          { id: 'brace', label: 'Brace Hours', value: braceWornThisWeek || 0, max: braceTimeRequiredThisWeek, icon: 'time' },
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: weeklyExpectedSessions, icon: 'fitness' },
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
          { id: 'walking', label: 'Daily Walking (min)', value: walkingMinutes || 0, max: 30, icon: 'walk' },
          { id: 'physio', label: 'Physio Sessions', value: physioSessions || 0, max: weeklyExpectedSessions, icon: 'fitness' }
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
          {/* Show unearned badges only if there are any */}
          {unearnedBadges.length > 0 && (
            <View style={styles.section}>
              <View style={styles.header}>
                <Ionicons name="star-outline" size={moderateScale(18)} color={COLORS.tabInactive} />
                <Text style={styles.headerText}>Badges to Earn ({unearnedBadges.length})</Text>
                <View style={{width: moderateScale(18)}}></View>
              </View>
              
              <FlatList
                data={showAllUnearnedBadges ? unearnedBadges : unearnedBadges.slice(0, 4)}
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
              
              {/* Show More/Show Less button - only show if there are more than 4 badges */}
              {unearnedBadges.length > 4 && (
                <View style={styles.showMoreContainer}>
                  <ReusableButton 
                    onPress={() => setShowAllUnearnedBadges(!showAllUnearnedBadges)}
                    btnText={showAllUnearnedBadges ? "Show Less" : `Show More (${unearnedBadges.length - 4} more)`}
                    textColor={COLORS.white}
                    width="100%"
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderRadius={moderateScale(8)}
                    borderColor={COLORS.tabActiveStart}
                  />
                </View>
              )}
            </View>
)}

          {/* Show earned badges only if there are any */}
          {earnedBadges.length > 0 && (
            <View style={styles.section}>
              <View style={styles.header}>
                <Ionicons name="trophy" size={moderateScale(18)} color={COLORS.tabActiveStart} />
                <Text style={styles.headerText}>Earned Badges ({earnedBadges.length})</Text>
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
          )}

          {/* Show message if no badges earned yet */}
          {earnedBadges.length === 0 && (
            <View style={styles.section}>
              <View style={styles.emptyStateContainer}>
                <Ionicons name="trophy-outline" size={moderateScale(48)} color={COLORS.lightGray} />
                <Text style={styles.emptyStateTitle}>No Badges Earned Yet</Text>
                <Text style={styles.emptyStateDescription}>
                  Complete your daily activities to start earning badges!
                </Text>
              </View>
            </View>
          )}
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
  showMoreContainer: {
    marginTop: moderateScale(12),
    alignItems: 'center',
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(30),
  },
  emptyStateTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: moderateScale(10),
    marginBottom: moderateScale(5),
  },
  emptyStateDescription: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    textAlign: 'center',
    paddingHorizontal: moderateScale(20),
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