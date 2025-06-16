import React, { useState, useContext, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../reusable/HeightSpacer';
import ReusableButton from '../reusable/ReusableButton';
import { ProgressBar } from 'react-native-paper';
import BraceTimer from './BraceTimer';
import NewBadgePopup from '../newBadgePopup';
import { Context as ActivityContext } from '../../context/ActivityContext'; 
import { Context as UserContext } from '../../context/UserContext'; 

const BraceTrackerInterface = ({ 
  wearingSchedule, 
  onActivityComplete,
  showSuccess,
  successMessage,
  isStreakAnimationActive = false,
  onNewBadgeEarned = () => {} // Keep for compatibility but handle locally
}) => {
  const { state, updateBraceWornHours, initBraceTracking } = useContext(ActivityContext); 
  const { state: UserState, resetDailyBraceHours } = useContext(UserContext); 
  const [timerOn, setTimerOn] = useState(false);
  const [progressColor, setProgressColor] = useState(COLORS.primaryPurple);
  const goalAchievedToday = useRef(false);
  
  // Badge popup state - back to local handling but streak-aware
  const [showNewBadgePopup, setShowNewBadgePopup] = useState(false);
  const [newBadgePopupData, setNewBadgePopupData] = useState(null);
  const [pendingBadgeData, setPendingBadgeData] = useState(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize brace tracking when component mounts
  useEffect(() => {
    // Reset brace hours in both contexts if it's a new day
    initBraceTracking();
    resetDailyBraceHours(); 
  }, []);

  // Handle showing pending badges when streak animation completes
  useEffect(() => {
    if (!isStreakAnimationActive && pendingBadgeData) {
      console.log("Streak animation completed, showing pending badge");
      setNewBadgePopupData(pendingBadgeData);
      setShowNewBadgePopup(true);
      setPendingBadgeData(null);
    }
  }, [isStreakAnimationActive, pendingBadgeData]);
  
  // Get worn hours from the wearingHistory map for today, defaulting to 0
  const wornTodayHours = state.braceData?.[today] || UserState.user?.treatmentData?.brace?.wearingHistory?.[today] || 0;
  
  // Expected wearing hours (from props or default)
  const expectedWearingHours = wearingSchedule || 16;
  
  // Calculate time remaining
  const braceTimeRemaining = expectedWearingHours - wornTodayHours;

  useEffect(() => {
    if (wornTodayHours >= expectedWearingHours) {
      setProgressColor(COLORS.accentGreen);
      // Trigger activity completion for streak update if goal just achieved
      if (!goalAchievedToday.current && onActivityComplete) {
        goalAchievedToday.current = true;
        onActivityComplete('brace');
      }
    } else {
      setProgressColor(COLORS.primaryPurple);
    }
  }, [wornTodayHours, expectedWearingHours, onActivityComplete]);
  
  const handleBadgeDisplay = (badgeData) => {
    if (!badgeData) return;
    
    console.log("Badge earned in brace interface:", badgeData);
    
    if (isStreakAnimationActive) {
      // Streak is active, store badge for later
      console.log("Streak animation active, storing badge for later");
      setPendingBadgeData(badgeData);
    } else {
      // No streak, show immediately
      console.log("No streak animation, showing badge immediately");
      setNewBadgePopupData(badgeData);
      setShowNewBadgePopup(true);
    }
  };
  
  const handleTimeSaved = async (hours) => {
    try {
      const result = await updateBraceWornHours(hours);
      if (!result?.success) {
        console.error('Error updating brace hours:', result?.error);
        return;
      }

      // Handle badge display with streak awareness
      if (result.newAchievements && result.newAchievements.length > 0) {
        handleBadgeDisplay(result.newAchievements[0]);
      }
  
      // Manually calculate updated hours
      const updatedHours = (wornTodayHours || 0) + hours;
  
      // Check if goal was achieved and trigger activity completion
      if (updatedHours >= expectedWearingHours && !goalAchievedToday.current && onActivityComplete) {
        goalAchievedToday.current = true;
        onActivityComplete('brace');
      }
    } catch (error) {
      console.error('Error in handleTimeSaved:', error);
    }
  };
  
  // Quick log hours function
  const quickLogHours = async (hours) => {
    try {
      const result = await updateBraceWornHours(hours);
      if (!result?.success) {
        console.error('Error in quickLogHours:', result?.error);
        return;
      }

      // Handle badge display with streak awareness
      if (result.newAchievements && result.newAchievements.length > 0) {
        handleBadgeDisplay(result.newAchievements[0]);
      }
  
      // Manually calculate updated hours
      const updatedHours = (wornTodayHours || 0) + hours;
  
      // Check if goal was achieved and trigger activity completion
      if (updatedHours >= expectedWearingHours && !goalAchievedToday.current && onActivityComplete) {
        goalAchievedToday.current = true;
        onActivityComplete('brace');
      }
    } catch (error) {
      console.error('Error in quickLogHours:', error);
    }
  };  

  // Get recent history data
  const getRecentHistory = () => {
    const history = [];
    const now = new Date();
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const hours = state.braceData?.[dateStr] || UserState.user?.treatmentData?.brace?.wearingHistory?.[dateStr] || 0;
      const percentage = Math.round((hours / expectedWearingHours) * 100);
      
      let status = '🟡';
      if (percentage >= 95) {
        status = '✅';
      } else if (percentage < 75) {
        status = '❌';
      }
      
      history.push({
        status,
        date: dateStr,
        summary: `${typeof hours === 'number' ? hours.toFixed(1) : '0.0'}/${expectedWearingHours} hrs (${percentage}%)`
      });
    }
    
    return history;
  };

  const recentHistory = getRecentHistory();

  return (
    <View style={styles.container}>
      {/* Success Message */}
      {showSuccess && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      {/* Badge Popup */}
      <NewBadgePopup
        visible={showNewBadgePopup && newBadgePopupData !== null}
        badge={newBadgePopupData}
        onAnimationComplete={() => {
          setShowNewBadgePopup(false);
          setNewBadgePopupData(null);
        }}
      />

      {timerOn && (
        <BraceTimer
          onTimeSaved={handleTimeSaved}
          expectedHours={expectedWearingHours}
          currentHours={wornTodayHours}
        />
      )}

      {/* Brace Tracker Header + Progress + Timer */}
      <View style={styles.card}>
        <Text style={styles.headerText}>Brace Tracker</Text>

        <Text style={styles.progressText}>Daily Brace Wear</Text>
        <ProgressBar
          progress={wornTodayHours / expectedWearingHours}
          color={progressColor}
          style={styles.paperProgressBar}
        />
        <Text style={styles.timeText}>
          {typeof wornTodayHours === 'number' ? wornTodayHours.toFixed(1) : '0.0'} / {expectedWearingHours} hours 
        </Text>

        <HeightSpacer height={moderateScale(15)} /> 

        <View style={styles.timerRow}>
          <Text style={styles.timerText}>Time Remaining Today</Text>
          <Text style={styles.timerTextBold}>
            {typeof braceTimeRemaining === 'number' ? Math.max(0, braceTimeRemaining).toFixed(1) : '0.0'} Hours
          </Text>
        </View>

        <HeightSpacer height={moderateScale(10)} />

        <ReusableButton
          btnText={timerOn ? "Hide Timer" : "▶ Start Timer"}
          backgroundColor={COLORS.primaryPurple}
          textColor={COLORS.white}
          useGradient={false}
          width="100%"
          borderWidth={0}
          borderColor="transparent"
          onPress={() => setTimerOn(prev => !prev)}
        />
      </View>

      <HeightSpacer height={moderateScale(15)} />

      {/* Quick Log Section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Quick Log Hours</Text>
        <HeightSpacer height={moderateScale(15)} />
        <View style={styles.quickLogRow}>
          {[1, 2, 4].map((hours, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.quickLogBtn}
              onPress={() => quickLogHours(hours)}
            >
              <Text style={styles.quickLogText}>+{hours} hr</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <HeightSpacer height={moderateScale(15)} />

      {/* History Section */}
      <View style={styles.card}>
        <View style={styles.historyHeaderRow}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>

        {recentHistory.map((entry, index) => (
          <View key={index} style={styles.historyItemRow}>
            <Text style={[styles.historyIcon, { 
              color: entry.status === '✅' ? COLORS.accentGreen : 
                     entry.status === '❌' ? COLORS.errorRed : 
                     COLORS.warningYellow 
            }]}>
              {entry.status}
            </Text>
            <Text style={styles.historyText}>{entry.date}</Text>
            <Text style={styles.historyDuration}>{entry.summary}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default BraceTrackerInterface;

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(15) 
  },
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
  },
  headerText: {
    color: COLORS.text,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: moderateScale(5) 
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  progressText: {
    color: COLORS.text,
    fontWeight: '600',
    marginTop: moderateScale(10),
  },
  paperProgressBar: {
    height: moderateScale(10),
    borderRadius: moderateScale(10),
    backgroundColor: COLORS.white,
    marginTop: moderateScale(6),
  },
  timeText: {
    color: COLORS.text,
    fontSize: moderateScale(12),
    marginTop: moderateScale(6),
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerText: {
    color: COLORS.text,
    fontSize: moderateScale(14),
  },
  timerTextBold: {
    color: COLORS.text,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  quickLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickLogBtn: {
    backgroundColor: COLORS.timerBackground,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: COLORS.primaryPurple,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: moderateScale(4),
  },
  quickLogText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  viewAll: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  historyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  historyIcon: {
    fontSize: moderateScale(14),
    marginRight: moderateScale(8),
  },
  historyText: {
    flex: 1,
    color: COLORS.text,
    fontSize: moderateScale(13),
  },
  historyDuration: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  successBanner: {
    backgroundColor: COLORS.accentGreen,
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    marginBottom: moderateScale(15),
    alignItems: 'center',
  },
  successText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});