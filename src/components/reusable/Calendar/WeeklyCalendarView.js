import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';

const WeeklyCalendarView = ({ currentDate, onDateSelect, events = {}, selectedDate = null }) => {
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    setCalendarDays(daysInWeek);
  }, [currentDate]);

  const getEventsForDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return events[dateString] || [];
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.weekDaysRow}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, dayIndex) => (
          <View key={dayIndex} style={styles.weekDayHeader}>
            <Text style={styles.weekDayText}>{dayName}</Text>
          </View>
        ))}
      </View>

      <View style={styles.weekDaysRow}>
        {calendarDays.map((day, index) => {
          const dateEvents = getEventsForDate(day);
          const isSelected = selectedDate && 
            format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
          const isToday_ = isToday(day);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDay,
                isToday_ && styles.todayCell
              ]}
              onPress={() => onDateSelect(day)}
            >
              <Text style={[
                styles.dayNumber,
                isSelected && styles.selectedDayText
              ]}>
                {day.getDate()}
              </Text>

              <View style={styles.eventBadgeContainer}>
                {(() => {
                  const physioEvents = dateEvents.filter(event => event.type === 'physio');
                  const physioCount = physioEvents.length;

                  if (physioCount > 0) {
                    return (
                      <View style={styles.physioBadge}>
                        <Ionicons name="pulse" size={moderateScale(10)} color="#10B981" />
                        <Text style={styles.physioCountText}>×{physioCount}</Text>
                      </View>
                    );
                  }
                  return null;
                })()}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default WeeklyCalendarView;

const styles = StyleSheet.create({
  calendarContainer: {
    marginBottom: moderateScale(15),
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(2),
    marginBottom: moderateScale(5),
  },
  weekDayHeader: {
    flexBasis: '13%',
    maxWidth: '13%',
    alignItems: 'center',
    paddingVertical: moderateScale(6),
  },
  weekDayText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
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
  physioCountText: {
    color: '#10B981',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    fontWeight: '600',
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
  
  eventBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  physioBadge: {
    flexDirection: 'row',
  },
  physioCountText: {
    color: '#10B981',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    fontWeight: '600',
  },
}); 