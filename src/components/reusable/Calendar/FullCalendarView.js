import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';

const FullCalendarView = ({ currentDate, onDateSelect, events = {}, selectedDate = null, onLoadCalendarEvents }) => {
  const [calendarDays, setCalendarDays] = useState([]); 

  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const firstDayOfMonth = getDay(monthStart);
    const days = [];

    // Add leading empty days (from previous month)
    const leadingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < leadingDays; i++) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - (leadingDays - i));
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    daysInMonth.forEach(date => {
      days.push({ date, isCurrentMonth: true });
    });

    // Add trailing days to complete grid
    const trailingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= trailingDays; i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }

    setCalendarDays(days);
  }, [currentDate]);

  const getEventsForDate = (date) => {
    if (!events) return [];
    
    // Try different date formats since Firebase might use a different format
    const dateFormatYMD = format(date, 'yyyy-MM-dd'); // Standard format with leading zeros
    
    // Check if there are events for this date
    if (events[dateFormatYMD]) {
      return events[dateFormatYMD];
    }
    
    // If not using the standard format, try to match by date components
    // This is a fallback for when the date formats don't match exactly
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-based
    const day = date.getDate();
    
    // Look through all keys for a match by date components
    for (const key in events) {
      // Try to parse the date key
      try {
        const keyDate = new Date(key);
        if (
          keyDate.getFullYear() === year &&
          keyDate.getMonth() + 1 === month &&
          keyDate.getDate() === day
        ) {
          return events[key];
        }
      } catch (e) {
        // Skip invalid dates
        continue;
      }
    }
    
    return [];
  };

  const renderDayHeader = () => {
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => (
          <View key={index} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.calendarContainer}>
      {renderDayHeader()}
      
      <View style={styles.daysGrid}>
        {calendarDays.map((day, index) => {
          const { date, isCurrentMonth } = day;
          const dateEvents = getEventsForDate(date);
          const isSelected = selectedDate && 
            format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
          const isToday_ = isToday(date);
          
          return (
            <TouchableOpacity 
              key={index}
              style={[
                styles.dayCell,
                !isCurrentMonth && styles.outsideMonth,
                isSelected && styles.selectedDay,
                isToday_ && styles.todayCell
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[
                styles.dayNumber,
                !isCurrentMonth && styles.outsideMonthText,
                isSelected && styles.selectedDayText
              ]}>
                {date.getDate()}
              </Text>
              
              <View style={styles.eventList}>
                {dateEvents.map((event, i) => (
                  <View key={i} style={styles.eventRow}>
                    {event.type === 'brace' && (
                      <>
                        <Ionicons name="time-outline" size={10} color="#3B82F6" />
                        <Text numberOfLines={1} style={styles.braceEvent}>{event.title}</Text>
                      </>
                    )}
                    
                    {event.type === 'physio' && (
                      <>
                        <Ionicons name="pulse" size={10} color="#10B981" />
                        <Text numberOfLines={1} style={styles.physioEvent}>{event.title}</Text>
                      </>
                    )}
                    
                    {event.type === 'pain' && (
                      <>
                        <Ionicons name="flame" size={10} color="#EF4444" />
                        <Text numberOfLines={1} style={styles.painEvent}>{event.title}</Text>
                      </>
                    )}
                    
                    {event.type === 'mood' && (
                      <>
                        <Ionicons name="sunny" size={10} color="#F59E0B" />
                        <Text numberOfLines={1} style={styles.moodEvent}>{event.title}</Text>
                      </>
                    )}
                    
                    {event.type === 'appointment' && (
                      <>
                        <Ionicons name="medkit" size={10} color="#8B5CF6" />
                        <Text numberOfLines={1} style={styles.appointmentEvent}>{event.title}</Text>
                      </>
                    )}

                    {/* Change this to show general events better, e.g., icon is shit! */} 
                    {event.type === 'general' && ( 
                      <>
                        <Ionicons name="medkit" size={10} color="#8B5CF6" />
                        <Text numberOfLines={1} style={styles.appointmentEvent}>{event.title}</Text>
                      </>
                    )}
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default FullCalendarView;

const styles = StyleSheet.create({
  calendarContainer: {
    marginBottom: moderateScale(15),
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(10),
  },
  weekDay: {
    flexBasis: `${100/7}%`, 
    maxWidth: `${100/7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(6),
  },
  weekDayText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(2),
  },
  dayCell: {
    flexBasis: '13%',
    maxWidth: '13%',
    aspectRatio: 1,
    padding: moderateScale(5),
    backgroundColor: COLORS.workoutOption,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: moderateScale(6),
    marginVertical: moderateScale(4),
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  outsideMonth: {
    opacity: 0.4,
  },
  selectedDay: {
    borderColor: '#A130D3',
    borderWidth: 2,
  },
  todayCell: {
    backgroundColor: 'rgba(161, 48, 211, 0.2)',
  },
  dayNumber: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  outsideMonthText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  selectedDayText: {
    fontWeight: 'bold',
    color: '#A130D3',
  },
  eventList: {
    marginTop: moderateScale(2),
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(1),
  },
  braceEvent: {
    color: '#3B82F6',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
  physioEvent: {
    color: '#10B981',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
  painEvent: {
    color: '#EF4444',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
  moodEvent: {
    color: '#F59E0B',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
  appointmentEvent: {
    color: '#8B5CF6',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
});