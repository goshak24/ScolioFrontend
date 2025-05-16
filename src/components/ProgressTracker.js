import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Context as UserContext } from '../context/UserContext';
import { Context as ActivityContext } from '../context/ActivityContext';

const ProgressTracker = ({ physioStreak }) => {  
  const { state: { user } } = useContext(UserContext);
  const { state: activityState } = useContext(ActivityContext);
  const accType = user?.acc_type?.toLowerCase() || 'physio';
  const [expectedPhysioSessions, setExpectedPhysioSessions] = useState(30);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]; 

  // Get brace hours worn today from activity context
  const braceHoursWorn = activityState.braceData?.[today] || user?.treatmentData?.brace?.wearingHistory?.[today] || 0;
  const expectedBraceHours = user?.treatmentData?.brace?.wearingSchedule || 16;
  
  // Get completed physio sessions 
  const completedPhysioSessions = user?.physioSessions || 0;

  // Generate an array of 7 days with active days logic
  const activeDays = Array(7)
    .fill(false)
    .map((_, index) => {
      if (physioStreak % 7 === 0 && physioStreak > 0) {
        // If streak is exactly a multiple of 7 (7, 14, 21, etc.), light up all days
        return true;
      } else {
        // Otherwise, light up (streak % 7) days
        return index < (physioStreak % 7);
      }
    });

  // Different content based on account type
  const getProgressTitle = () => {
    switch (accType) {
      case 'brace':
        return 'Brace Wearing Progress';
      case 'physio':
        return 'Exercise Progress';
      case 'brace + physio':
        return 'Treatment Progress';
      default:
        return 'Your Progress';
    }
  };

  // Calculate progress for the specific account type
  const getProgressContent = () => {
    switch (accType) {
      case 'brace':
        return (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.min(1, braceHoursWorn / expectedBraceHours)}
              color={braceHoursWorn >= expectedBraceHours ? COLORS.accentGreen : COLORS.primaryPurple}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              Brace wearing: {braceHoursWorn.toFixed(1)} / {expectedBraceHours} hours today
            </Text>
          </View>
        );
      case 'physio':
        return (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.min(1, completedPhysioSessions / expectedPhysioSessions)}
              color={COLORS.primaryPurple}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              Physio sessions: {completedPhysioSessions} / {expectedPhysioSessions} sessions
            </Text>
          </View>
        );
      case 'brace + physio':
        return (
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Brace Hours:</Text>
            <ProgressBar
              progress={Math.min(1, braceHoursWorn / expectedBraceHours)}
              color={braceHoursWorn >= expectedBraceHours ? COLORS.accentGreen : COLORS.primaryPurple}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {braceHoursWorn.toFixed(1)} / {expectedBraceHours} hours today
            </Text>
            
            <HeightSpacer height={moderateScale(10)} />
            
            <Text style={styles.progressLabel}>Physio Sessions:</Text>
            <ProgressBar
              progress={Math.min(1, completedPhysioSessions / expectedPhysioSessions)}
              color={COLORS.primaryPurple}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {completedPhysioSessions} / {expectedPhysioSessions} sessions
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={getProgressPercentage()}
              color={COLORS.primaryPurple}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>Weekly progress: {physioStreak || 0} days</Text>
          </View>
        );
    }
  };

  // Calculate percentage for the progress bar (between 0 and 1)
  const getProgressPercentage = () => {
    return Math.min(1, physioStreak / 30);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{getProgressTitle()}</Text>
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{physioStreak} days</Text>
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.streakContainer}>
          {activeDays.map((active, index) => (
            <View key={index} style={[styles.streakDay, active ? styles.streakActive : styles.streakInactive]}>
              <Ionicons name="flame" size={moderateScale(20)} color={active ? COLORS.streakOrange : COLORS.darkGray} />
            </View>
          ))}
        </View>
        <Text style={styles.streakInfo}>
          {physioStreak % 7 === 0 && physioStreak > 0 
            ? `Great job! You've completed ${physioStreak / 7} full weeks!` 
            : 'Keep your streak going! Complete your daily tasks.'}
        </Text>
      </View>

      {getProgressContent()}
    </View>
  );
};

// Add HeightSpacer component to avoid import error
const HeightSpacer = ({ height }) => {
  return <View style={{ height }} />;
};

export default ProgressTracker;

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(7.5),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  progressContainer: {
    marginTop: moderateScale(10),
  },
  progressBar: {
    height: verticalScale(8),
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    marginVertical: verticalScale(5),
  },
  progressLabel: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  section: {
    backgroundColor: COLORS.cardDark, 
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(10),
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
  streakBadge: {
    backgroundColor: COLORS.streakOrange,
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
  },
  streakText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(5),
  },
  streakDay: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakActive: {
    backgroundColor: COLORS.streakActive,
  },
  streakInactive: {
    backgroundColor: COLORS.streakInactive,
  },
  streakInfo: {
    color: COLORS.lightGray,
    fontSize: moderateScale(11),
    textAlign: 'center',
    marginTop: moderateScale(8),
  },
  progressText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginBottom: moderateScale(5),
  },
}); 