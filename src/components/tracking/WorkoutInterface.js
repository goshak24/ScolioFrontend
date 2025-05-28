import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../../components/reusable/HeightSpacer';
import { Context as UserContext } from '../../context/UserContext'; 
import { Context as ActivityContext } from '../../context/ActivityContext';
import StreakExtensionAnimation from '../StreakExtensionAnimation';
import { getFormattedDate, getDateStringFromFirestoreTimestamp } from '../timeZoneHelpers'; 

const WorkoutInterface = ({ workouts = [], weeklySchedule = [], customHeader = null }) => {
    const { updateStreak, logPhysio } = useContext(ActivityContext);
    const { state: { user }, incrementPhysio } = useContext(UserContext);
    
    const [selectedWorkouts, setSelectedWorkouts] = useState([]);
    const [remainingTime, setRemainingTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showStreakAnimation, setShowStreakAnimation] = useState(false);
    const [streakExtended, setStreakExtended] = useState(false);
    const [showOtherDays, setShowOtherDays] = useState(false);
    const streakUpdatedToday = useRef(false);

    console.log('user', user.treatmentData?.physio?.scheduledWorkouts);

    const today = getFormattedDate();
    const lastStreakUpdate = user?.lastStreakUpdate;

    const lastUpdateDateString = getDateStringFromFirestoreTimestamp(lastStreakUpdate);

    // Check if streak was already updated today from UserContext
    const wasStreakUpdatedToday = lastUpdateDateString === today; 
    
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Get current day name
    const getCurrentDayName = () => {
        const currentDate = new Date();
        const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Adjust so Monday = 0
        return dayNames[adjustedIndex];
    };

    const currentDayName = getCurrentDayName();

    // Get workouts organized by day
    const getOrganizedWorkouts = () => {
        const scheduledWorkouts = user?.treatmentData?.physio?.scheduledWorkouts || {};
        
        // Get today's workouts
        const todaysWorkouts = scheduledWorkouts[currentDayName] || [];
        
        // Get other days' workouts
        const otherDaysWorkouts = {};
        dayNames.forEach(day => {
            if (day !== currentDayName && scheduledWorkouts[day] && scheduledWorkouts[day].length > 0) {
                otherDaysWorkouts[day] = scheduledWorkouts[day];
            }
        });

        return { todaysWorkouts, otherDaysWorkouts };
    };

    const { todaysWorkouts, otherDaysWorkouts } = getOrganizedWorkouts();

    // Get recent history data from user's physio sessions
    const getRecentHistory = () => {
        const history = [];
        const now = new Date();
        
        // Get expected daily physio sessions (default to 1)
        const expectedSessions = user?.treatmentData?.physio?.physioFrequency 
            ? Math.ceil(user.treatmentData.physio.physioFrequency / 7) 
            : 1;
        
        // Get physio history from user data - using new structure
        const physioHistory = user?.treatmentData?.physio?.physioHistory || {};
        
        // Generate last 5 days history
        for (let i = 0; i < 3; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Get completed sessions for this date (if available)
            const completedSessions = physioHistory[dateStr] || 0;
            
            // Determine status icon
            let status = '🟡';
            if (completedSessions >= expectedSessions) {
                status = '✅';
            } else if (completedSessions === 0) {
                status = '❌';
            }
            
            // Format date for display (e.g., "Jun 15, 2023")
            const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            history.push({
                status,
                date: formattedDate,
                rawDate: dateStr,
                summary: `${completedSessions}/${expectedSessions} session${expectedSessions > 1 ? 's' : ''}`,
                completed: completedSessions > 0
            });
        }
        
        return history;
    };

    // Format time (MM:SS)
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Create a combined workout list with day indicators
    const createCombinedWorkoutList = () => {
        const combined = [];
        let workoutIndex = 0;

        // Add today's workouts first
        todaysWorkouts.forEach((workout, index) => {
            combined.push({
                ...workout,
                originalIndex: workoutIndex,
                day: currentDayName,
                isToday: true,
                dayIndex: index
            });
            workoutIndex++;
        });

        // Add other days' workouts if expanded
        if (showOtherDays) {
            Object.entries(otherDaysWorkouts).forEach(([day, dayWorkouts]) => {
                dayWorkouts.forEach((workout, index) => {
                    combined.push({
                        ...workout,
                        originalIndex: workoutIndex,
                        day: day,
                        isToday: false,
                        dayIndex: index
                    });
                    workoutIndex++;
                });
            });
        }

        return combined;
    };

    const combinedWorkouts = createCombinedWorkoutList();

    // Toggle workout selection
    const toggleWorkoutSelection = (originalIndex) => {
        setSelectedWorkouts(prev => {
            const newSelection = prev.includes(originalIndex)
                ? prev.filter(i => i !== originalIndex)
                : [originalIndex];

            // Calculate total time in seconds using combined workout list
            const newTotalTime = newSelection.reduce((sum, i) => {
                const workout = combinedWorkouts.find(w => w.originalIndex === i);
                if (!workout?.time || typeof workout.time !== 'string' || !workout.time.includes(":")) return sum;
            
                const [minutes, seconds] = workout.time.split(":").map(Number);
                return sum + (minutes * 60 + seconds);
            }, 0);

            setRemainingTime(newTotalTime);
            return newSelection;
        });
    };

    // Start workout timer
    const startWorkout = () => {
        if (isRunning || remainingTime <= 0) return;
        setIsRunning(true);
    };

    // Stop workout timer
    const stopWorkout = () => {
        setIsRunning(false);
    };

    // Reset workout timer
    const resetWorkout = () => {
        setIsRunning(false);
        setRemainingTime(
            selectedWorkouts.reduce((sum, i) => {
                const workout = combinedWorkouts.find(w => w.originalIndex === i);
                if (!workout?.time || typeof workout.time !== 'string' || !workout.time.includes(":")) return sum;
          
                const [minutes, seconds] = workout.time.split(":").map(Number);
                return sum + (minutes * 60 + seconds);
            }, 0)
        ); 
    };

    // Timer effect
    useEffect(() => {
        let intervalId;
        
        if (isRunning && remainingTime > 0) {
            intervalId = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalId);
                        setIsRunning(false);
                        setStreakExtended(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isRunning, remainingTime]);

    // Handle streak extension when the timer completes
    useEffect(() => {
        if (streakExtended) {
            handleActivityCompletion(today);
            setStreakExtended(false);
        }
    }, [streakExtended]);

    const handleActivityCompletion = async (specificDate = null) => {
        try {
            // Log physio session for either the specified date or today
            console.log("Calling logPhysio...");
            const physioResult = await logPhysio(specificDate);
            console.log("logPhysio result:", physioResult);

            if (physioResult.success) {
                // Always increment the local state counter
                incrementPhysio(specificDate);
                
                // Show success feedback
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);

                // Only update streak if it hasn't been updated today
                if (!streakUpdatedToday.current && !wasStreakUpdatedToday) {
                    console.log("Updating streak...");
                    const streakResult = await updateStreak();
                    
                    if (streakResult.success) {
                        streakUpdatedToday.current = true;
                        setShowStreakAnimation(true);
                    }
                }
            } else {
                console.error("Failed to log physio session:", physioResult.error);
            }
        } catch (error) {
            console.error("Activity completion error:", error);
        }
    };

    // Get the recent history data
    const recentHistory = getRecentHistory();

    // Render workout section
    const renderWorkoutSection = (workouts, sectionTitle, isExpanded = true) => {
        if (workouts.length === 0) return null;

        return (
            <View style={styles.workoutSection}>
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
                {workouts.map((exercise, index) => (
                    <TouchableOpacity
                        key={`${exercise.day}-${index}`}
                        style={[
                            styles.exerciseRow,
                            selectedWorkouts.includes(exercise.originalIndex) && styles.selectedWorkout,
                        ]}
                        onPress={() => toggleWorkoutSelection(exercise.originalIndex)}
                    >
                        {exercise.icon && (
                            <Image source={exercise.icon} style={styles.exerciseIcon} />
                        )}
                        <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{exercise.title}</Text>
                            <Text style={styles.exerciseTime}>{exercise.time}</Text>
                            {!exercise.isToday && (
                                <Text style={styles.exerciseDay}>({exercise.day})</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Streak Extension Animation */}
            <StreakExtensionAnimation 
                visible={showStreakAnimation} 
                message="Streak Extended!" 
                onAnimationComplete={() => setShowStreakAnimation(false)}
            />

            <View style={styles.card}>
                {/* Render custom header or default title */}
                {customHeader ? (
                    customHeader
                ) : (
                    <View style={styles.titleRow}> 
                        <Text style={styles.headerText}>Physiotherapy Tracker</Text> 
                    </View>
                )}

                <HeightSpacer height={moderateScale(5)} /> 

                {/* Timer Display */}
                {remainingTime > 0 && (
                    <View style={styles.timerRow}>
                        <Text style={styles.timerText}>⏳ {formatTime(remainingTime)}</Text>
                        
                        <TouchableOpacity 
                            style={[styles.controlButton, styles.stopButton]} 
                            onPress={stopWorkout}
                        >
                            <Text style={styles.controlButtonText}>⏹ Stop</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.controlButton, styles.resetButton]} 
                            onPress={resetWorkout}
                        >
                            <Text style={styles.controlButtonText}>🔄 Reset</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showSuccess && (
                    <Text style={styles.successText}>{wasStreakUpdatedToday ? 'Physio session completed! 💪' : 'Streak extended! 🔥'}</Text>
                )}

                <ScrollView>
                    {/* Today's Workouts Section */}
                    {todaysWorkouts.length > 0 ? (
                        renderWorkoutSection(
                            todaysWorkouts.map((workout, index) => ({
                                ...workout,
                                originalIndex: index,
                                day: currentDayName,
                                isToday: true
                            })),
                            `Today's Workouts (${currentDayName})`
                        )
                    ) : (
                        <View style={styles.noWorkoutsContainer}>
                            <Text style={styles.noWorkoutsText}>No workouts scheduled for today ({currentDayName})</Text>
                        </View>
                    )}

                    {/* Other Days Expandable Section */}
                    {Object.keys(otherDaysWorkouts).length > 0 && (
                        <View style={styles.expandableSection}>
                            <TouchableOpacity 
                                style={styles.expandableHeader}
                                onPress={() => setShowOtherDays(!showOtherDays)}
                            >
                                <Text style={styles.expandableHeaderText}>Other Days</Text>
                                <Text style={styles.expandableArrow}>
                                    {showOtherDays ? '▲' : '▼'}
                                </Text>
                            </TouchableOpacity>
                            
                            {showOtherDays && (
                                <View style={styles.expandableContent}>
                                    {Object.entries(otherDaysWorkouts).map(([day, dayWorkouts]) => (
                                        <View key={day} style={styles.daySection}>
                                            <Text style={styles.daySectionTitle}>{day}</Text>
                                            {dayWorkouts.map((exercise, index) => {
                                                const originalIndex = todaysWorkouts.length + 
                                                    Object.entries(otherDaysWorkouts)
                                                        .slice(0, Object.keys(otherDaysWorkouts).indexOf(day))
                                                        .reduce((sum, [_, workouts]) => sum + workouts.length, 0) + index;
                                                
                                                return (
                                                    <TouchableOpacity
                                                        key={`${day}-${index}`}
                                                        style={[
                                                            styles.exerciseRow,
                                                            styles.otherDayExercise,
                                                            selectedWorkouts.includes(originalIndex) && styles.selectedWorkout,
                                                        ]}
                                                        onPress={() => toggleWorkoutSelection(originalIndex)}
                                                    >
                                                        {exercise.icon && (
                                                            <Image source={exercise.icon} style={styles.exerciseIcon} />
                                                        )}
                                                        <View style={styles.exerciseInfo}>
                                                            <Text style={styles.exerciseName}>{exercise.title}</Text>
                                                            <Text style={styles.exerciseTime}>{exercise.time}</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>

                {/* Start Workout Button */}
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={startWorkout}
                    disabled={remainingTime <= 0}
                >
                    <LinearGradient
                        colors={[COLORS.accentGreen, "#0D9488"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>
                            {isRunning ? 'Workout in Progress' : '▶ Start Workout'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <HeightSpacer height={moderateScale(15)} /> 

            {/* Weekly Schedule Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Weekly Schedule</Text>
                <View style={styles.weekRow}>
                    {days.map((day, idx) => (
                    <View
                        key={idx}
                        style={[
                        styles.dayPill,
                        weeklySchedule.includes(day) && styles.dayPillActive,
                        ]}
                    >
                        <Text style={styles.dayPillText}>{day}</Text>
                    </View>
                    ))}
                </View>
                <Text style={styles.scheduleNote}>
                    Scheduled days: {weeklySchedule.map(d => {
                    switch (d) {
                        case 'M': return 'Monday';
                        case 'T': return 'Tuesday';
                        case 'W': return 'Wednesday';
                        case 'T': return 'Thursday';
                        case 'F': return 'Friday';
                        case 'S': return 'Saturday';
                        case 'S': return 'Sunday';
                        default: return d;
                    }
                    }).join(', ')}
                </Text>
            </View>

            <HeightSpacer height={moderateScale(15)} />

            {/* History Section */}
            <View style={styles.card}>
                <View style={styles.historyHeaderRow}>
                    <Text style={styles.cardTitle}>Recent History</Text>
                    <Text style={styles.viewAll}>View All</Text>
                </View>
                
                {recentHistory.length > 0 ? (
                    recentHistory.map((item, index) => (
                        <View key={index} style={styles.historyItemRow}>
                            <Text style={styles.historyIcon}>
                                {item.status}
                            </Text>
                            <Text style={styles.historyText}>{item.date}</Text>
                            <Text style={styles.historyDuration}>{item.summary}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noHistoryText}>No recent physio sessions found.</Text>
                )}
            </View>

            {/* Tips Section */}
            <View style={styles.tipsCard}>
                <Text style={styles.tipsHeader}>Tips for Today's Workout</Text>
                <View style={styles.tipRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.tipText}>Remember to breathe deeply during each exercise</Text>
                </View>
                <View style={styles.tipRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.tipText}>Focus on quality over speed - form is everything!</Text>
                </View>
                <View style={styles.tipRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.tipText}>If something hurts (not just feels challenging), stop and skip that exercise</Text>
                </View>
            </View> 
        </View>
    );
};

const styles = StyleSheet.create({
  container: { 
    marginTop: moderateScale(15), 
    paddingBottom: moderateScale(50),
    ...Platform.select({
        ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        android: {
            elevation: 3,
        },
    }),
  },
  headerText: {
      color: COLORS.text,
      fontSize: moderateScale(18), 
      fontWeight: 'bold',
      marginBottom: moderateScale(5),
  },
  card: {
      backgroundColor: COLORS.cardDark, 
      padding: moderateScale(15),
      borderRadius: moderateScale(12), 
      ...Platform.select({
          ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
          },
          android: {
              elevation: 2,
          },
      }),
  },
  titleRow: {
      alignItems: 'flex-start',
  },
  cardTitle: {
      color: COLORS.text,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
  },
  
  // New workout section styles
  workoutSection: {
      marginBottom: moderateScale(10),
  },
  sectionTitle: {
      color: COLORS.accentGreen,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
      marginBottom: moderateScale(8),
      paddingLeft: moderateScale(4),
  },
  noWorkoutsContainer: {
      backgroundColor: COLORS.workoutOption,
      padding: moderateScale(15),
      borderRadius: moderateScale(10),
      marginBottom: moderateScale(10),
      alignItems: 'center',
  },
  noWorkoutsText: {
      color: COLORS.lightGray,
      fontSize: moderateScale(14),
      textAlign: 'center',
      fontStyle: 'italic',
  },
  
  // Expandable section styles
  expandableSection: {
      marginTop: moderateScale(15),
      borderTopWidth: 1,
      borderTopColor: COLORS.lightGray + '30',
      paddingTop: moderateScale(10),
  },
  expandableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.workoutOption,
      padding: moderateScale(12),
      borderRadius: moderateScale(8),
      marginBottom: moderateScale(8),
  },
  expandableHeaderText: {
      color: COLORS.text,
      fontSize: moderateScale(15),
      fontWeight: 'bold',
  },
  expandableArrow: {
      color: COLORS.accentGreen,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
  },
  expandableContent: {
      marginTop: moderateScale(5),
  },
  daySection: {
      marginBottom: moderateScale(15),
  },
  daySectionTitle: {
      color: COLORS.primaryPurple,
      fontSize: moderateScale(14),
      fontWeight: 'bold',
      marginBottom: moderateScale(6),
      paddingLeft: moderateScale(8),
  },
  otherDayExercise: {
      marginLeft: moderateScale(8),
      opacity: 0.8,
  },

  exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.workoutOption,
      padding: Platform.OS === 'ios' ? moderateScale(12) : moderateScale(10),
      borderRadius: moderateScale(10),
      marginVertical: moderateScale(3),
  },
  selectedWorkout: {
      backgroundColor: COLORS.primaryPurple,
  },
  exerciseIcon: {
      width: moderateScale(30),
      height: moderateScale(30),
      marginRight: moderateScale(10),
  },
  exerciseInfo: {
      flex: 1,
  },
  exerciseName: {
      color: COLORS.text,
      fontSize: moderateScale(14),
  },
  exerciseTime: {
      color: COLORS.lightGray,
      fontSize: moderateScale(12),
  },
  exerciseDay: {
      color: COLORS.primaryPurple,
      fontSize: moderateScale(11),
      fontStyle: 'italic',
      marginTop: moderateScale(2),
  },
  timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.timerBackground,
      padding: moderateScale(10),
      borderRadius: moderateScale(10),
      marginBottom: moderateScale(8)
  },
  timerText: {
      color: COLORS.text,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
  },
  controlButton: {
      paddingVertical: moderateScale(8),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(8),
  },
  stopButton: {
      backgroundColor: COLORS.red,
  },
  resetButton: {
      backgroundColor: COLORS.lightGray,
  },
  controlButtonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: moderateScale(14),
  },
  button: {
      marginTop: moderateScale(10),
  },
  gradientButton: {
      padding: moderateScale(12),
      borderRadius: moderateScale(10),
      alignItems: 'center',
  },
  buttonText: {
      color: COLORS.white,
      fontWeight: 'bold',
      fontSize: moderateScale(14),
  },
  successText: {
      color: COLORS.accentGreen,
      textAlign: 'center',
      marginBottom: moderateScale(10),
  },

  cardTitle: {
    color: COLORS.text,
    fontSize: moderateScale(15),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
  },
  
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  
  dayPill: {
    backgroundColor: COLORS.workoutOption,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    borderRadius: moderateScale(6),
    alignItems: 'center',
    flex: 1,
    marginHorizontal: moderateScale(3),
  },
  
  dayPillActive: {
    backgroundColor: COLORS.accentGreen,
  },
  
  dayPillText: {
    color: COLORS.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: moderateScale(13),
  },
  
  scheduleNote: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginTop: moderateScale(4),
  },
  
  historyHeaderRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'bottom',
  },
  
  viewAll: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(10),
  },
  
  historyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  
  historyIcon: {
    fontSize: moderateScale(14),
    marginRight: moderateScale(10),
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
  
  noHistoryText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: moderateScale(10),
  },

  // workout tips styles
tipsCard: {
      backgroundColor: COLORS.cardDark,
      borderRadius: moderateScale(10),
      padding: moderateScale(16),
      marginTop: moderateScale(15)
    },
tipsHeader: {
      color: COLORS.text,
      fontSize: moderateScale(16),
      fontWeight: 'bold',
      marginBottom: moderateScale(8),
    },
tipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: moderateScale(5),
    },
bulletPoint: {
      color: COLORS.primaryPurple,
      fontSize: moderateScale(18),
      marginRight: moderateScale(5),
    },
tipText: {
      color: COLORS.text,
      fontSize: moderateScale(14),
    },

    daysContainer: {
        marginBottom: moderateScale(15),
        alignItems: 'center',
      },
      daysText: {
        fontSize: moderateScale(28),
        fontWeight: 'bold',
        color: COLORS.white,
      },
      subText: {
        color: COLORS.lightGray,
        marginTop: moderateScale(4),
      },
});

export default WorkoutInterface;