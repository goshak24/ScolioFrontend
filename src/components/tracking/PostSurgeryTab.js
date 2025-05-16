import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import WorkoutInterface from './WorkoutInterface';
import HeightSpacer from '../reusable/HeightSpacer';
import { 
  DaysSinceCard, 
  DailyWalkingCard, 
  RecoveryChecklist 
} from '../post-surgery';
import CalendarModal from '../reusable/Calendar/CalendarModal';
import { Context as UserContext } from '../../context/UserContext';
import { format } from 'date-fns';

const PostSurgeryTab = ({ workouts = [], weeklySchedule = [], recoveryTasks, walkingMinutes, handleToggleTask, daysSinceSurgery, surgeryDate }) => {
  const [activeTab, setActiveTab] = useState('Recovery'); 
  const targetWalkingMinutes = 30;
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduledEvents, setScheduledEvents] = useState({});
  const [localWorkouts, setLocalWorkouts] = useState([]);
  const [localWeeklySchedule, setLocalWeeklySchedule] = useState([]);
  const { state: { user }, addUserPhysioWorkout } = useContext(UserContext);

  // Initialize local workouts with props
  useEffect(() => {
    setLocalWorkouts(workouts);
    setLocalWeeklySchedule(weeklySchedule);
  }, [workouts, weeklySchedule]);
  
  // Get events from user data (if available)
  const userEvents = user?.events || {};
  
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Format workout data for WorkoutInterface
  const formatWorkoutFromEvents = () => {
    const allEvents = { ...userEvents, ...scheduledEvents };
    const formattedWorkouts = [];
    const scheduleSet = new Set(localWeeklySchedule);
    
    // Process the events into workout format
    Object.entries(allEvents).forEach(([dateStr, events]) => {
      events.forEach(event => {
        if (event.type === 'physio') {
          formattedWorkouts.push({
            title: event.title || 'Workout',
            time: event.time || '05:00',
            day: getDayFromDateString(dateStr),
            id: event.id || `local-${dateStr}-${Math.random()}`
          });
          
          // Add the day to the weekly schedule if not already there
          const day = getDayFromDateString(dateStr);
          if (day && !scheduleSet.has(day)) {
            scheduleSet.add(day);
          }
        }
      });
    });
    
    setLocalWorkouts([...workouts, ...formattedWorkouts]);
    setLocalWeeklySchedule([...Array.from(scheduleSet)]);
  };
  
  // Get day name from date string
  const getDayFromDateString = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      
      const dayName = format(date, 'EEE');
      return dayName;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  };
  
  // Update workouts when events change
  useEffect(() => {
    if (Object.keys(scheduledEvents).length > 0) {
      formatWorkoutFromEvents();
    }
  }, [scheduledEvents]);

  const handleEventAdd = async (date, newEvent) => {
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
      name: newEvent.title // Adding name field as backend might expect it
    };

    // Add to API and update user context
    try {
      const result = await addUserPhysioWorkout(workoutData, dateStr, dayOfWeek);
      
      if (result.success) {
        console.log('Workout added successfully:', result);
        
        // Create a new workout entry for local state
        const newWorkout = {
          title: workoutData.title,
          time: workoutData.time,
          day: getDayFromDateString(dateStr) || format(date, 'EEE'),
          id: `local-${dateStr}-${Math.random()}`
        };
        
        // Update local workouts list
        setLocalWorkouts(prev => [...prev, newWorkout]);
        
        // Update weekly schedule if needed
        const dayAbbr = format(date, 'EEE');
        if (!localWeeklySchedule.includes(dayAbbr)) {
          setLocalWeeklySchedule(prev => [...prev, dayAbbr]);
        }
      } else {
        console.error('Failed to add workout:', result.error);
      }
    } catch (error) {
      console.error('Error adding workout:', error);
    }

    // Update local state with new event (for UI)
    setScheduledEvents(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newEvent]
    }));
  };

  const handleEventDelete = (date, eventIndex) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if there are events for this date
    if (scheduledEvents[dateStr] && scheduledEvents[dateStr].length > 0) {
      // Create a new copy of the events object
      const updatedEvents = {...scheduledEvents};
      
      // Remove the event at the specified index
      updatedEvents[dateStr] = [
        ...updatedEvents[dateStr].slice(0, eventIndex),
        ...updatedEvents[dateStr].slice(eventIndex + 1)
      ];
      
      // If there are no more events for this date, remove the date key
      if (updatedEvents[dateStr].length === 0) {
        delete updatedEvents[dateStr];
      }
      
      setScheduledEvents(updatedEvents);
    }
  };

  // Custom workout title row with plus icon
  const renderWorkoutHeader = () => (
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
  );

  return (
    <View>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Recovery', 'Physio'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabWrapper}
              activeOpacity={0.85}
            >
              {isActive ? (
                <LinearGradient
                  colors={activeTab === 'Recovery' ? [COLORS.primaryPurple, COLORS.primaryPurple] : [COLORS.accentGreen, "#0D9488"]} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                >
                  <Text style={[styles.tabText, styles.activeTabText]}>{tab}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Text style={styles.tabText}>{tab}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'Recovery' ? ( 
        <View style={{ marginTop: moderateScale(15) }}>
          <DaysSinceCard days={daysSinceSurgery} surgeryDate={surgeryDate} />
          <HeightSpacer height={moderateScale(15)} />
          <DailyWalkingCard 
            minutes={walkingMinutes}
            targetMinutes={targetWalkingMinutes}
          />
          <HeightSpacer height={moderateScale(15)} />
          <RecoveryChecklist 
            tasks={recoveryTasks} 
            onToggleTask={handleToggleTask}
          />
        </View> 
      ) : (
        <View>
          <WorkoutInterface 
            workouts={localWorkouts || []} 
            weeklySchedule={localWeeklySchedule || []} 
            customHeader={renderWorkoutHeader()}
          /> 
        </View>
      )}

      {/* Calendar Modal for adding workouts */}
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
    </View>
  );
};

export default PostSurgeryTab;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    overflow: 'hidden', 
  },
  tabWrapper: {
    flex: 1,
  },
  tabGradient: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTab: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: 'bold', 
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  activeTabText: {
    color: COLORS.white,
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