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
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduledEvents, setScheduledEvents] = useState({});
  const [localWorkouts, setLocalWorkouts] = useState([]);
  const [localWeeklySchedule, setLocalWeeklySchedule] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showNewBadgePopup, setShowNewBadgePopup] = useState(false);
  const [newBadgePopupData, setNewBadgePopupData] = useState(null);
  const [pendingBadges, setPendingBadges] = useState([]); // queue of badges to display

  // Centralized streak state
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [isProcessingStreak, setIsProcessingStreak] = useState(false);
  const [isProcessingActivity, setIsProcessingActivity] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const streakUpdatedToday = useRef(false);
  const activityInProgress = useRef(false);

  // Normalize new badges from various backend response shapes
  const extractNewBadges = useCallback((result) => {
    if (!result) return [];
    if (Array.isArray(result.newBadges) && result.newBadges.length > 0) return result.newBadges;
    if (Array.isArray(result.newAchievements) && result.newAchievements.length > 0) return result.newAchievements;
    if (result.badge) return [result.badge];
    return [];
  }, []);

  // Push badges into queue
  const enqueueBadges = useCallback((badges) => {
    if (!badges || badges.length === 0) return;
    setPendingBadges(prev => [...prev, ...badges]);
  }, []);

  // Show next badge if allowed (no streak anim and popup not visible)
  const maybeShowNextBadge = useCallback(() => {
    setPendingBadges(prev => {
      if (showStreakAnimation || showNewBadgePopup || prev.length === 0) return prev;
      const [nextBadge, ...rest] = prev;
      setNewBadgePopupData(nextBadge);
      setShowNewBadgePopup(true);
      return rest;
    });
  }, [showStreakAnimation, showNewBadgePopup]);

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
    // Prevent multiple activity completions during processing
    if (activityInProgress.current || isProcessingStreak || isProcessingActivity) {
      console.log("Activity or streak already processing, skipping...");
      return;
    }

    // Set processing flags
    activityInProgress.current = true;
    setIsProcessingActivity(true);
  
    try {
      let activityResult;
      let message = '';
      const accountType = userData?.userAccType?.toLowerCase();
      const targetDate = specificDate || today;
  
      // Switch statement for different activity types
      switch (activityType) {
        case 'physio':
          console.log("Processing physio completion...");
          activityResult = await logPhysio(specificDate);
          
          if (activityResult.success) {
            incrementPhysio(specificDate);
            message = 'Physio session completed! 💪';
          }
          break;
        
        case 'brace':
          console.log("Processing brace completion...");
          activityResult = await updateBraceWornHours(specificDate);
            
          if (activityResult.success) {
            message = 'Brace goal achieved! 🦴';
          }
          break;
  
        case 'brace + physio':
          console.log("Processing brace + physio completion...");
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
          await updateRecoveryTasks(taskId);
          activityResult = { success: true };
          message = 'Recovery task completed! 📝';
          break; 
  
        default:
          console.warn("Unknown activity type:", activityType);
          return;
      }
  
      if (activityResult && activityResult.success) {
        // Show success feedback immediately
        setSuccessMessage(message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);

        // Queue any new badges from the activity result
        const activityBadges = extractNewBadges(activityResult);
        if (activityBadges.length > 0) {
          console.log("New badges from activity:", activityBadges.map(b => b?.id || b?.name));
          enqueueBadges(activityBadges);
        }
  
        // Check if streak should be updated
        const shouldCheckStreak = !streakUpdatedToday.current && !wasStreakUpdatedToday && !isProcessingStreak;
        
        if (shouldCheckStreak) {
          // Wait a bit to ensure all state updates are processed
          setTimeout(async () => {
            try {
              const shouldUpdateStreak = await checkStreakConditions(accountType, activityType, targetDate, activityResult);
              
                if (shouldUpdateStreak) {
                console.log("Will show streak first, then badge");
                await handleStreakUpdate();
                // Badges will be shown after streak animation completes
              } else {
                console.log("No streak, showing badge immediately");
                // No streak animation; show next queued badge now
                maybeShowNextBadge();
              }
            } catch (error) {
              console.error("Error checking streak conditions:", error);
              // On error, still try to show any queued badge
              maybeShowNextBadge();
            }
          }, 100);
        } else {
          console.log("Streak already updated, showing badge immediately");
          maybeShowNextBadge();
        }
      } else {
        console.error("Failed to log activity:", activityResult?.error);
      }
    } catch (error) {
      console.error("Activity completion error:", error);
    } finally {
      // Always reset processing flags
      activityInProgress.current = false;
      setIsProcessingActivity(false);
    }
  }, [
    logPhysio, 
    updateBraceWornHours, 
    incrementPhysio, 
    updateStreak, 
    updateRecoveryTasks,
    isRecoveryChecklistCompleteForDate,
    wasStreakUpdatedToday, 
    today,
    isProcessingStreak,
    isProcessingActivity,
    userData,
    user,
    activityState,
    getFullDayNameFromDate,
    showBadge,
    checkStreakConditions,
    handleStreakUpdate,
    extractNewBadges,
    enqueueBadges,
    maybeShowNextBadge
  ]);

  // Separate function to check streak conditions
  const checkStreakConditions = useCallback(async (accountType, activityType, targetDate, activityResult) => {
    const currentBraceHours = activityState?.braceData?.[targetDate] || 0;
    const braceTarget = user?.treatmentData?.brace?.wearingSchedule || 0;
    const dayName = getFullDayNameFromDate(targetDate);
    const scheduledWorkoutsForDay = user?.treatmentData?.physio?.scheduledWorkouts?.[dayName] || [];
    const completedPhysioSessions = user?.treatmentData?.physio?.physioHistory?.[targetDate] || 0;
    
    let shouldUpdateStreak = false;
    
    if (accountType === 'brace + physio') {
      let braceHoursForDate = currentBraceHours;
      
      if (activityType === 'brace' && activityResult.totalHours !== undefined) {
        braceHoursForDate = activityResult.totalHours;
      }
      
      let isPhysioComplete = scheduledWorkoutsForDay.length === 0;
      if (!isPhysioComplete) {
        const requiredSessions = scheduledWorkoutsForDay.length;
        const actualCompleted = activityType === 'physio' ? completedPhysioSessions + 1 : completedPhysioSessions;
        isPhysioComplete = actualCompleted >= requiredSessions;
      }

      const isBraceComplete = braceHoursForDate >= braceTarget;
      shouldUpdateStreak = isBraceComplete && isPhysioComplete;

    } else if (accountType === 'physio') {
      if (scheduledWorkoutsForDay.length === 0) {
        shouldUpdateStreak = true;
      } else {
        const requiredSessions = scheduledWorkoutsForDay.length;
        const actualCompleted = activityType === 'physio' ? completedPhysioSessions + 1 : completedPhysioSessions;
        shouldUpdateStreak = actualCompleted >= requiredSessions;
      }

    } else if (accountType === 'post-surgery') {
      let isPhysioComplete = scheduledWorkoutsForDay.length === 0;
      if (!isPhysioComplete) {
        const requiredSessions = scheduledWorkoutsForDay.length;
        const actualCompleted = activityType === 'physio' ? completedPhysioSessions + 1 : completedPhysioSessions;
        isPhysioComplete = actualCompleted >= requiredSessions;
      }
      
      const isRecoveryChecklistComplete = await isRecoveryChecklistCompleteForDate(targetDate); 
      shouldUpdateStreak = isPhysioComplete && isRecoveryChecklistComplete;

    } else {
      shouldUpdateStreak = true;
    }

    return shouldUpdateStreak;
  }, [activityState, user, getFullDayNameFromDate, isRecoveryChecklistCompleteForDate]);

  // Separate function to handle streak updates
  const handleStreakUpdate = useCallback(async () => {
    if (isProcessingStreak) {
      console.log("Streak already processing, skipping...");
      return;
    }

    console.log("Starting streak update...");
    setIsProcessingStreak(true);
    
    try {
      const streakResult = await updateStreak();
      
      if (streakResult.success) {
        console.log("Streak updated successfully");
        streakUpdatedToday.current = true;
        // Queue any badges awarded by streak update
        const streakBadges = extractNewBadges(streakResult);
        if (streakBadges.length > 0) {
          console.log("New badges from streak:", streakBadges.map(b => b?.id || b?.name));
          enqueueBadges(streakBadges);
        }
        // Start streak animation; queued badges will show after it completes
        setShowStreakAnimation(true);
      } else {
        console.error("Streak update failed:", streakResult.error);
        // Even on failure, attempt to show any queued badges
        setTimeout(maybeShowNextBadge, 200);
      }
    } catch (error) {
      console.error("Streak update error:", error);
      // On error, attempt to show any queued badges
      setTimeout(maybeShowNextBadge, 200);
    } finally {
      setIsProcessingStreak(false);
    }
  }, [updateStreak, isProcessingStreak, extractNewBadges, enqueueBadges, maybeShowNextBadge]);
  
  // Reset processing state when animation completes
  useEffect(() => {
    if (!showStreakAnimation && isProcessingStreak) {
      console.log("Streak animation completed, resetting processing state");
      setIsProcessingStreak(false);
    }
  }, [showStreakAnimation, isProcessingStreak]);

  // Simple badge management - show badge when not conflicting with streak
  const showBadge = useCallback((badgeData) => {
    if (!badgeData) return;
    
    console.log("Showing badge:", badgeData);
    setNewBadgePopupData(badgeData);
    setShowNewBadgePopup(true);
  }, []);

  // Clean up processing flags on unmount
  useEffect(() => {
    return () => {
      activityInProgress.current = false;
      streakUpdatedToday.current = false;
    };
  }, []);

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

  // Keep this function for compatibility but it's no longer needed since brace components handle badges locally
  const handleNewBadgeEarned = useCallback((badgeData) => {
    // This is now handled by the individual components
    console.log("Badge handling delegated to components");
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
                  onActivityCompletePhysio={(date) => handleActivityCompletion('physio', date)}
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
                  onActivityCompletePhysio={(date) => handleActivityCompletion('physio', date)}
                 onBadgeEarned={(badgeData) => {
                   console.log("Badge earned from brace+physio interface:", badgeData);
                   enqueueBadges([badgeData]);
                   if (!showStreakAnimation) maybeShowNextBadge();
                 }}
                 showSuccess={showSuccess}
                 successMessage={successMessage}
                 isStreakAnimationActive={showStreakAnimation}
                 isProcessingActivity={isProcessingActivity}
                 onNewBadgeEarned={handleNewBadgeEarned}
               />;
      case 'brace':
        return <BraceTrackerInterface 
                 data={userData.braceData} 
                 wearingSchedule={userData.braceData.wearingSchedule}
                 onActivityComplete={handleActivityCompletion}
                 onBadgeEarned={(badgeData) => {
                   console.log("Badge earned from brace interface:", badgeData);
                   enqueueBadges([badgeData]);
                   if (!showStreakAnimation) maybeShowNextBadge();
                 }}
                 showSuccess={showSuccess}
                 successMessage={successMessage}
                 isStreakAnimationActive={showStreakAnimation}
                 isProcessingActivity={isProcessingActivity}
                 onNewBadgeEarned={handleNewBadgeEarned}
               />;
      case 'physio':
                return (
            <WorkoutInterface 
              workouts={localWorkouts} 
              weeklySchedule={localWeeklySchedule}
              frequency={userData.physioFrequency}
              customHeader={renderWorkoutHeader()}
              onActivityComplete={(date) => handleActivityCompletion('physio', date)}
              showSuccess={showSuccess}
              successMessage={successMessage}
              isProcessingActivity={isProcessingActivity}
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
          console.log("Streak animation completed, checking for pending badge");
          setShowStreakAnimation(false);
          
          // After streak completes, show next queued badge if any
          setTimeout(() => {
            maybeShowNextBadge();
          }, 400);
        }}
      />

      <NewBadgePopup
        visible={showNewBadgePopup && newBadgePopupData !== null}
        badge={newBadgePopupData}
        onAnimationComplete={() => {
          console.log("Badge popup animation completed");
          setShowNewBadgePopup(false);
          setNewBadgePopupData(null);
          // Show next badge if queued
          setTimeout(() => {
            maybeShowNextBadge();
          }, 250);
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