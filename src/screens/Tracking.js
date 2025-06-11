import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView, Text, ActivityIndicator, Platform } from 'react-native';
import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import WorkoutInterface from '../components/tracking/WorkoutInterface';
import COLORS from '../constants/COLORS';
import { moderateScale } from 'react-native-size-matters';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext';
import { Context as ActivityContext } from '../context/ActivityContext';
import HeightSpacer from '../components/reusable/HeightSpacer';
import BracePhysio from '../components/tracking/BracePhysio';
import BraceTrackerInterface from '../components/tracking/BraceTrackerInterface';
import PresurgeryInterface from '../components/tracking/PresurgeryInterface';
import PostsurgeryInterface from '../components/tracking/PostsurgeryInterface';
import Constants from 'expo-constants'
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarModal from '../components/reusable/Calendar/CalendarModal';
import { format } from 'date-fns';
import StreakExtensionAnimation from '../components/StreakExtensionAnimation';
import { getFormattedDate, getDateStringFromFirestoreTimestamp } from '../components/timeZoneHelpers';
import { Context as PostSurgeryContext } from '../context/PostSurgeryContext';
import NewBadgePopup from '../components/newBadgePopup';

const Tracking = () => {
  const { state: { idToken } } = useContext(AuthContext);
  const { state: { user, loading }, fetchUserData, addUserPhysioWorkout, incrementPhysio } = useContext(UserContext);
  const { state: activityState, updateStreak, logPhysio, updateBraceWornHours } = useContext(ActivityContext); 
  const { updateRecoveryTasks, isRecoveryChecklistCompleteForDate } = useContext(PostSurgeryContext);

  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [scheduledEvents, setScheduledEvents] = useState({});
  const [localWorkouts, setLocalWorkouts] = useState([]);
  const [localWeeklySchedule, setLocalWeeklySchedule] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNewBadgePopup, setShowNewBadgePopup] = useState(false);
  const [newBadgePopupData, setNewBadgePopupData] = useState(null);
  const [pendingBadgeData, setPendingBadgeData] = useState(null);

  // Centralized streak state
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const streakUpdatedToday = useRef(false);

  // Get today's date and check if streak was already updated
  const today = getFormattedDate();
  const lastStreakUpdate = user?.lastStreakUpdate;
  const lastUpdateDateString = getDateStringFromFirestoreTimestamp(lastStreakUpdate);
  const wasStreakUpdatedToday = lastUpdateDateString === today;

  // Only fetch user data once when idToken is available and user is not loaded
  useEffect(() => {
    if (idToken && !user && !loading) {
      fetchUserData(idToken);
    }
  }, [idToken, user, loading, fetchUserData]);

  // Memoize user data extraction to prevent unnecessary recalculations
  const userData = useMemo(() => {
    if (!user) return null;
    
    const userAccType = user.acc_type || '';
    const scheduledWorkouts = user.treatmentData?.physio?.scheduledWorkouts || {};
    const braceData = user.treatmentData?.brace || {};
    const surgeryData = user.treatmentData?.surgery || {};
    const physioFrequency = user.treatmentData?.physio?.frequency || '';

    const parsedWorkouts = Object.entries(scheduledWorkouts)
      .filter(([_, workouts]) => Array.isArray(workouts) && workouts.length > 0)
      .flatMap(([day, workouts]) =>
        workouts.map(workout => ({
          ...workout,
          day,
          title: workout.title || 'Workout',
          time: workout.time || '00:00'
        }))
      );

    const dayMap = {
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
      Sunday: 'Sun',
    };

    const weeklySchedule = Object.keys(scheduledWorkouts)
      .filter(day => scheduledWorkouts[day]?.length > 0)
      .map(day => dayMap[day] || day);

    return {
      userAccType,
      scheduledWorkouts,
      braceData,
      surgeryData,
      physioFrequency,
      parsedWorkouts,
      weeklySchedule
    };
  }, [user]);

  // Initialize local workouts when userData changes and handle updates
  useEffect(() => {
    if (userData) {
      // For initial load, set the local state from user data
      if (!isInitialized) {
        setLocalWorkouts([...userData.parsedWorkouts]);
        setLocalWeeklySchedule([...userData.weeklySchedule]);
        setIsInitialized(true);
      } else {
        // For subsequent updates, merge the user data with local state
        // This ensures we don't lose locally added workouts that might not be in the fetched data yet
        const mergedWorkouts = [...userData.parsedWorkouts];
        
        // Add any local workouts that might not be in the user data yet
        localWorkouts.forEach(localWorkout => {
          const existsInUserData = userData.parsedWorkouts.some(
            userWorkout =>
              userWorkout.title === localWorkout.title &&
              userWorkout.time === localWorkout.time &&
              userWorkout.day === localWorkout.day
          );
        
          if (!existsInUserData && !localWorkout.synced) {
            mergedWorkouts.push(localWorkout);
          }
        });

        setLocalWorkouts(mergedWorkouts);
        
        // Update weekly schedule similarly
        const mergedSchedule = [...userData.weeklySchedule];
        localWeeklySchedule.forEach(day => {
          if (!mergedSchedule.includes(day)) {
            mergedSchedule.push(day);
          }
        });
        
        setLocalWeeklySchedule(mergedSchedule);
      }
    }
  }, [userData?.parsedWorkouts, userData?.weeklySchedule, isInitialized]);

  // Get events from user data (if available)
  const userEvents = useMemo(() => user?.events || {}, [user?.events]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // Get day name from date string
  const getDayFromDateString = useCallback((dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      const dayName = format(date, 'EEE');
      return dayName;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }, []);

  // Helper function to get full day name from date
  const getFullDayNameFromDate = useCallback((dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[date.getDay()];
    } catch (error) {
      console.error('Error getting day name:', error);
      return null;
    }
  }, []);  

  // Helper function to check if physio is complete for a specific date
  const isPhysioCompleteForDate = useCallback((date, count = 0) => {
    if (!user?.treatmentData?.physio) return false;
    
    const physioHistory = user.treatmentData.physio.physioHistory || {};
    const scheduledWorkouts = user.treatmentData.physio.scheduledWorkouts || {};
    
    // Get the full day name (e.g., "Saturday", "Monday") for the given date
    const dayName = getFullDayNameFromDate(date);
    if (!dayName) return false;
    
    // Get scheduled workouts for this day
    const workoutsForDay = scheduledWorkouts[dayName] || [];
    
    // If no workouts scheduled for this day, consider physio complete
    if (workoutsForDay.length === 0) {
      return true;
    }
    
    // Get completed sessions for this date
    const completedSessions = physioHistory[date] || 0;
    
    // Check if completed sessions meet or exceed scheduled workouts
    return completedSessions >= workoutsForDay.length + count - 1;
  }, [user, getFullDayNameFromDate]);

  // CENTRALIZED ACTIVITY COMPLETION HANDLER
  const handleActivityCompletion = useCallback(async (activityType, specificDate = null, taskId = null) => {
    try {
      let activityResult;
      let message = '';
      const accountType = userData?.userAccType?.toLowerCase();
      const targetDate = specificDate || today;
  
      // Switch statement for different activity types
      switch (activityType) {
        case 'physio':
          console.log("Calling logPhysio...");
          activityResult = await logPhysio(specificDate);

          console.log("Activity result:", activityResult);
          
          if (activityResult.success) {
            incrementPhysio(specificDate);
            message = 'Physio session completed! 💪';
          }
          break;
  
        case 'brace':
          console.log("Calling updateBraceWornHours...");
          activityResult = await updateBraceWornHours(specificDate);

          console.log("Activity result:", activityResult);
          
          if (activityResult.success) {
            message = 'Brace goal achieved! 🦴';
          }
          break;
  
        case 'brace + physio':
          console.log("Calling logPhysio for brace + physio...");
          activityResult = await logPhysio(specificDate);
          
          if (activityResult.success) {
            incrementPhysio(specificDate);
            message = 'Physio session completed! 💪';
          }
          break;
  
        case 'pre-surgery':
          console.log("Pre-surgery activity completion not implemented yet");
          return;
  
        case 'post-surgery-tasks': 
          // Just toggle the recovery task - we don't need the return value
          await updateRecoveryTasks(taskId);
          // Since updateRecoveryTasks doesn't return a success value, set it manually
          activityResult = { success: true };
          message = 'Recovery task completed! 📝';
          break; 
  
        default:
          console.warn("Unknown activity type:", activityType);
          return;
      }
  
      if (activityResult && activityResult.success) {
        // Show success feedback
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000); 
  
        // Determine if streak should be updated
        let shouldUpdateStreak = false;
        
        if (!streakUpdatedToday.current && !wasStreakUpdatedToday) {
          if (accountType === 'brace + physio') {
            // For brace + physio, check if both activities are completed
            let braceHoursForDate;
            
            if (activityType === 'brace' && activityResult.totalHours !== undefined) {
              braceHoursForDate = activityResult.totalHours;
            } else {
              braceHoursForDate = activityState?.braceData?.[targetDate] || 0;
            }
            
            const braceTarget = user?.treatmentData?.brace?.wearingSchedule || 0; 
            let isPhysioComplete;
  
            if (activityType === 'physio') {
              isPhysioComplete = isPhysioCompleteForDate(targetDate);
            } else {
              if (user.treatmentData?.physio?.scheduledWorkouts?.[getFullDayNameFromDate(targetDate)] === null) {
                isPhysioComplete = true;
              } else {
                isPhysioComplete = isPhysioCompleteForDate(targetDate, 1);
              }
            }
  
            const isBraceComplete = braceHoursForDate >= braceTarget;
            shouldUpdateStreak = isBraceComplete && isPhysioComplete;
  
          } else if (accountType === 'physio') {
            shouldUpdateStreak = isPhysioCompleteForDate(targetDate);
  
          } else if (accountType === 'post-surgery') {
            let isPhysioComplete;
            if (user.treatmentData?.physio?.scheduledWorkouts?.[getFullDayNameFromDate(targetDate)] === null) {
              isPhysioComplete = true;
            } else {
              isPhysioComplete = isPhysioCompleteForDate(targetDate);
            }
            
            const isRecoveryChecklistComplete = await isRecoveryChecklistCompleteForDate(targetDate); 
            shouldUpdateStreak = isPhysioComplete && isRecoveryChecklistComplete;
  
          } else {
            // For other account types, update streak immediately
            shouldUpdateStreak = true;
          }
        }
  
        // Handle new achievements/badges based on whether streak will update
        console.log("Checking for new achievements:", activityResult.newAchievements);
        if (activityResult.newAchievements && activityResult.newAchievements.length > 0) {
          console.log("New achievement earned:", activityResult.newAchievements[0]);
          
          if (shouldUpdateStreak) {
            // Streak will happen - store badge to show after streak animation
            console.log("Badge will be shown after streak animation");
            setPendingBadgeData(activityResult.newAchievements[0]);
          } else {
            // No streak - show badge immediately
            console.log("No streak update, showing badge immediately");
            setNewBadgePopupData(activityResult.newAchievements[0]);
            setShowNewBadgePopup(true);
          }
        }
  
        // Handle streak update
        if (shouldUpdateStreak) {
          console.log("Conditions met - updating streak...");
          const streakResult = await updateStreak();
          
          if (streakResult.success) {
            streakUpdatedToday.current = true;
            setShowStreakAnimation(true);
          } else {
            // If streak update failed but we have pending badge data, show it immediately
            if (pendingBadgeData) {
              console.log("Streak update failed, showing pending badge immediately");
              setNewBadgePopupData(pendingBadgeData);
              setShowNewBadgePopup(true);
              setPendingBadgeData(null);
            }
          }
        } 
      } else {
        console.error("Failed to log activity:", activityResult?.error);
      }
    } catch (error) {
      console.error("Activity completion error:", error);
    }
  }, [logPhysio, updateBraceWornHours, incrementPhysio, updateStreak, wasStreakUpdatedToday, userData, user, today, isPhysioCompleteForDate, isRecoveryChecklistCompleteForDate, activityState, getFullDayNameFromDate]);

  // ADD PHYSIO WORKOUT 
  const handleEventAdd = useCallback(async (date, newEvent) => {
    if (!date || !newEvent) return;
    
    // Format date for event storage
    const formatDateForKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dateStr = formatDateForKey(date);
    
    // Set event type as physio for workout events
    if (!newEvent.type) {
      newEvent.type = 'physio';
    }

    // Get day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[date.getDay()];
    
    // Create a workout object for the API
    const workoutData = {
      title: newEvent.title,
      time: newEvent.time || '05:00',
      type: 'physio',
    };

    // Create a new workout entry for immediate local state update
    const newWorkout = {
      title: workoutData.title,
      time: workoutData.time,
      day: getDayFromDateString(dateStr) || format(date, 'EEE'),
      id: `local-${dateStr}-${Date.now()}-${Math.random()}`
    };
    
    // Update local workouts list immediately for instant UI feedback
    setLocalWorkouts(prev => [...prev, newWorkout]);
    
    // Update weekly schedule if needed
    const dayAbbr = format(date, 'EEE');
    setLocalWeeklySchedule(prev => {
      if (!prev.includes(dayAbbr)) {
        return [...prev, dayAbbr];
      }
      return prev;
    });

    // Add to API and update user context
    try {
      const result = await addUserPhysioWorkout(workoutData, dateStr, dayOfWeek);
      
      if (result.success) {
        setLocalWorkouts(prev =>
          prev.map(workout =>
            workout.id === newWorkout.id
              ? { ...workout, id: result.id || workout.id, synced: true }
              : workout
          )
        );
        await fetchUserData(idToken);
      } else {
        console.error('Failed to add workout:', result.error);
        // Remove the workout from local state if API call failed
        setLocalWorkouts(prev => prev.filter(workout => workout.id !== newWorkout.id));
        setLocalWeeklySchedule(prev => {
          // Check if this was the only workout for this day
          const hasOtherWorkoutsForDay = prev.some(w => w.day === dayAbbr && w.id !== newWorkout.id);
          if (!hasOtherWorkoutsForDay) {
            return prev.filter(day => day !== dayAbbr);
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      // Remove the workout from local state if API call failed
      setLocalWorkouts(prev => prev.filter(workout => workout.id !== newWorkout.id));
      setLocalWeeklySchedule(prev => {
        // Check if this was the only workout for this day
        const hasOtherWorkoutsForDay = localWorkouts.some(w => w.day === dayAbbr && w.id !== newWorkout.id);
        if (!hasOtherWorkoutsForDay) {
          return prev.filter(day => day !== dayAbbr);
        }
        return prev;
      });
    }

    // Update local state with new event (for UI)
    setScheduledEvents(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newEvent]
    }));
  }, [addUserPhysioWorkout, getDayFromDateString, idToken, fetchUserData, localWorkouts]);

  const handleEventDelete = useCallback((date, eventIndex) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if there are events for this date
    setScheduledEvents(prev => {
      if (prev[dateStr] && prev[dateStr].length > 0) {
        // Create a new copy of the events object
        const updatedEvents = {...prev};
        
        // Remove the event at the specified index
        updatedEvents[dateStr] = [
          ...updatedEvents[dateStr].slice(0, eventIndex),
          ...updatedEvents[dateStr].slice(eventIndex + 1)
        ];
        
        // If there are no more events for this date, remove the date key
        if (updatedEvents[dateStr].length === 0) {
          delete updatedEvents[dateStr];
        }
        
        return updatedEvents;
      }
      return prev;
    });
  }, []);

  // Custom workout title row with plus icon
  const renderWorkoutHeader = useCallback(() => (
    <View style={styles.workoutHeaderRow}>
      <Text style={styles.workoutHeaderText}>Physiotherapy Tracker</Text>
      <TouchableOpacity 
        style={styles.addWorkoutButton}
        onPress={() => setShowCalendarModal(true)}
      >
        <LinearGradient
          colors={[COLORS.accentGreen, "#0D9488"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.addWorkoutGradient}
        >
          <Ionicons name="add" size={moderateScale(18)} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  ), []);

  // Early return for loading state
  if (loading || !user || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gradientPink} />
      </View>
    );
  }

  const renderTrackingComponent = () => {
    const accountType = userData.userAccType.toLowerCase();
    
    switch (accountType) {
      case 'post-surgery':
        return <PostsurgeryInterface 
                 physioData={{
                   exercises: localWorkouts,
                   weeklySchedule: localWeeklySchedule
                 }} 
                 surgeryData={userData.surgeryData}
                 onActivityCompletePhysio={() => handleActivityCompletion('physio')}
                 onActivityCompleteTasks={(taskId) => handleActivityCompletion('post-surgery-tasks', null, taskId)} 
                 showSuccess={showSuccess}
                 successMessage={successMessage}
               />;
      case 'pre-surgery':
        return <PresurgeryInterface 
                 braceData={userData.braceData}
                 surgeryData={userData.surgeryData}
                 onActivityComplete={() => handleActivityCompletion('pre-surgery')}
               />;
      case 'brace + physio':
        return <BracePhysio 
                 workouts={localWorkouts} 
                 weeklySchedule={localWeeklySchedule}
                 braceData={userData.braceData}
                 wearingSchedule={userData.braceData.wearingSchedule}
                 customHeader={renderWorkoutHeader()}
                 onActivityCompleteBrace={() => handleActivityCompletion('brace')}
                 onActivityCompletePhysio={() => handleActivityCompletion('physio')}
                 showSuccess={showSuccess}
                 successMessage={successMessage}
               />;
      case 'brace':
        return <BraceTrackerInterface 
                 data={userData.braceData} 
                 wearingSchedule={userData.braceData.wearingSchedule}
                 onActivityComplete={handleActivityCompletion}
                 showSuccess={showSuccess}
                 successMessage={successMessage}
               />;
      case 'physio':
        return (
            <WorkoutInterface 
              workouts={localWorkouts} 
              weeklySchedule={localWeeklySchedule}
              frequency={userData.physioFrequency}
              customHeader={renderWorkoutHeader()}
              onActivityComplete={() => handleActivityCompletion('physio')}
              showSuccess={showSuccess}
              successMessage={successMessage}
            />
        );
      default:
        return <Text style={styles.errorText}>No tracking interface for this account type</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}> 
      {/* Centralized Streak Extension Animation */}
      <StreakExtensionAnimation 
        visible={showStreakAnimation} 
        message="Streak Extended! 🔥" 
        duration={4000}
        enableVibration={true}
        enableSound={true}
        onAnimationComplete={() => {
          console.log("Streak animation completed, checking for pending badge:", pendingBadgeData);
          setShowStreakAnimation(false);
          // Show badge popup after streak animation completes
          if (pendingBadgeData) {
            console.log("Showing pending badge after streak animation");
            setNewBadgePopupData(pendingBadgeData);
            setShowNewBadgePopup(true);
            setPendingBadgeData(null);
          }
        }}
      />

      <NewBadgePopup
        visible={showNewBadgePopup && newBadgePopupData !== null}
        badge={newBadgePopupData}
        onAnimationComplete={() => {
          setShowNewBadgePopup(false);
          setNewBadgePopupData(null);
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
      >
        <Text style={styles.headerText}>Tracking</Text> 
        {renderTrackingComponent()}
      </ScrollView>

      {/* Calendar Modal for adding workouts - only show for physio and brace + physio */}
      {(userData.userAccType.toLowerCase() === 'physio' || userData.userAccType.toLowerCase() === 'brace + physio') && (
        <CalendarModal
          visible={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onDateSelect={handleDateSelect}
          events={{ ...userEvents, ...scheduledEvents }}
          onEventAdd={handleEventAdd}
          onEventDelete={handleEventDelete}
          initialDate={new Date()}
          defaultView="week"
        />
      )}
    </SafeAreaView>
  );
};

export default Tracking;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBackground
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
    marginVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10), 
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10)
  },
  headerText: {
    color: COLORS.text,
    fontSize: moderateScale(22),
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: moderateScale(15),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  workoutHeaderText: {
    color: COLORS.text,
    fontSize: moderateScale(18), 
    fontWeight: 'bold',
  },
  addWorkoutButton: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },
  addWorkoutGradient: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
  }
});