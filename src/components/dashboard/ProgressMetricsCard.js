import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { ProgressBar } from 'react-native-paper';
import COLORS from '../../constants/COLORS';
import moment from 'moment';
import { Context as PreSurgeryContext } from '../../context/PreSurgeryContext';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';

// Dashboard card that mirrors AchieveContent "progress" metrics, styled for dashboard
// Props: user, painLogs (array)
const ProgressMetricsCard = ({ user, painLogs }) => {
  const accTypeRaw = (user?.acc_type || '').toLowerCase();
  const accType = accTypeRaw.replace(/\s+/g, ' ').trim();
  const isPreSurgery = accType === 'presurgery' || accType === 'pre-surgery';
  const isPostSurgery = accType === 'postsurgery' || accType === 'post-surgery';

  // Contexts for surgery flows
  const preSurgCtx = useContext(PreSurgeryContext);
  const postSurgCtx = useContext(PostSurgeryContext);

  // Helpers for week windows
  const startOfIsoWeek = moment().startOf('isoWeek');
  const endOfIsoWeek = moment().endOf('isoWeek');
  const isInThisWeek = (dateString) => {
    const d = moment(dateString);
    return d.isBetween(startOfIsoWeek, endOfIsoWeek, undefined, '[]');
  };

  // Brace weekly hours
  const { weeklyBraceHours, weeklyBraceTarget } = useMemo(() => {
    const schedulePerDay = user?.treatmentData?.brace?.wearingSchedule || 16;
    const target = schedulePerDay * 7;
    const history = user?.treatmentData?.brace?.wearingHistory || {};
    let total = 0;
    Object.entries(history).forEach(([dateString, hours]) => {
      if (isInThisWeek(dateString)) total += Number(hours) || 0;
    });
    // Round for nicer display
    total = Math.round(total * 10) / 10;
    return { weeklyBraceHours: total, weeklyBraceTarget: target };
  }, [user?.treatmentData?.brace]);

  // Physio weekly sessions vs expected
  const { physioSessionsThisWeek, physioExpectedWeek } = useMemo(() => {
    // Count sessions in physioHistory for this ISO week
    const physioHistory = user?.treatmentData?.physio?.physioHistory || {};
    let sessions = 0;
    Object.entries(physioHistory).forEach(([dateString, count]) => {
      if (isInThisWeek(dateString)) sessions += Number(count) || 0;
    });

    // Expected: sum of scheduledWorkouts arrays across weekday keys
    const scheduled = user?.treatmentData?.physio?.scheduledWorkouts || {};
    const expected = Object.values(scheduled).reduce((sum, arr) => sum + ((arr && arr.length) || 0), 0);
    return { physioSessionsThisWeek: sessions, physioExpectedWeek: expected };
  }, [user?.treatmentData?.physio]);

  // Pain logs last 7 days
  const painLogsLast7 = useMemo(() => {
    if (!Array.isArray(painLogs)) return 0;
    const last7Start = moment().startOf('day').subtract(6, 'days');
    return painLogs.filter((l) => {
      const key = l?.date || l?.createdAt;
      if (!key) return false;
      const d = moment(key._seconds ? key._seconds * 1000 : key);
      return d.isSameOrAfter(last7Start, 'day');
    }).length;
  }, [painLogs]);

  // Surgery tasks and walking minutes from contexts
  const preChecklist = preSurgCtx?.state?.checklistItems || [];
  const preCompleted = preChecklist.filter((t) => t.completed).length;
  const postRecovery = postSurgCtx?.state?.recoveryTasks || [];
  const postCompleted = postRecovery.filter((t) => t.completed).length;
  const walkingMinutes = postSurgCtx?.state?.walkingMinutes || 0;

  // Streak days from user
  const streakDays = Number(user?.streaks || 0);

  // Build metrics similar to AchieveContent.getProgressMetrics
  const baseMetrics = [
    { id: 'streak', label: 'Streak Days', value: streakDays, max: 7, color: COLORS.tabActiveStart },
  ];

  let metrics = baseMetrics;
  switch (accType) {
    case 'brace':
      metrics = [
        ...baseMetrics,
        { id: 'brace', label: 'Brace Hours (this week)', value: weeklyBraceHours, max: weeklyBraceTarget || 112, color: COLORS.tabActiveStart },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
      break;
    case 'physio':
      metrics = [
        ...baseMetrics,
        { id: 'physio', label: 'Physio Sessions (this week)', value: physioSessionsThisWeek, max: physioExpectedWeek || 5, color: COLORS.tabActiveStart },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
      break;
    case 'brace + physio':
    case 'brace+physio':
      metrics = [
        ...baseMetrics,
        { id: 'brace', label: 'Brace Hours (this week)', value: weeklyBraceHours, max: weeklyBraceTarget || 112, color: COLORS.tabActiveStart },
        { id: 'physio', label: 'Physio Sessions (this week)', value: physioSessionsThisWeek, max: physioExpectedWeek || 5, color: COLORS.accentGreen },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
      break;
    case 'presurgery':
    case 'pre-surgery':
      metrics = [
        ...baseMetrics,
        { id: 'tasks', label: 'Prep Tasks Completed', value: preCompleted, max: preChecklist.length || 6, color: COLORS.tabActiveStart },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
      break;
    case 'postsurgery':
    case 'post-surgery':
      metrics = [
        ...baseMetrics,
        { id: 'recovery', label: 'Recovery Tasks', value: postCompleted, max: postRecovery.length || 5, color: COLORS.tabActiveStart },
        { id: 'walking', label: 'Daily Walking (min)', value: Math.min(30, walkingMinutes), max: 30, color: COLORS.accentGreen },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
      break;
    default:
      metrics = [
        ...baseMetrics,
        { id: 'brace', label: 'Brace Hours (this week)', value: weeklyBraceHours, max: weeklyBraceTarget || 112, color: COLORS.tabActiveStart },
        { id: 'physio', label: 'Physio Sessions (this week)', value: physioSessionsThisWeek, max: physioExpectedWeek || 5, color: COLORS.accentGreen },
        { id: 'pain', label: 'Pain Logs (7 days)', value: painLogsLast7, max: 7, color: COLORS.gradientPurple },
      ];
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your Progress</Text>
      <View style={{ marginTop: moderateScale(8) }}>
        {metrics.map((m) => {
          const progress = m.max ? Math.min(1, Math.max(0, Number(m.value || 0) / Number(m.max))) : 0;
          return (
            <View key={m.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemLabel}>{m.label}</Text>
                <Text style={styles.itemValue}>{`${m.value || 0}/${m.max}`}</Text>
              </View>
              <ProgressBar progress={progress} color={m.color || COLORS.gradientPurple} style={styles.progressBar} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ProgressMetricsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginTop: moderateScale(14)
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16)
  },
  item: {
    marginTop: moderateScale(10)
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(6)
  },
  itemLabel: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    fontWeight: '600'
  },
  itemValue: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12)
  },
  progressBar: {
    height: moderateScale(8),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.progressBackground,
  }
});

