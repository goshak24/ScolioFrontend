import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, startOfWeek, addDays, isToday } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../../constants/COLORS';
import { moderateScale } from 'react-native-size-matters';

const CalendarView = ({ 
  currentDate, 
  onDateSelect, 
  events = {}, 
  selectedDate = null 
}) => {
  const [weekDays, setWeekDays] = useState([]);

  // Calculate the days of the current week (Monday to Sunday)
  useEffect(() => {
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(startOfWeekDate, i);
      days.push({
        date,
        isToday: isToday(date),
      });
    }
    setWeekDays(days);
  }, [currentDate]);

  const getEventsForDate = (date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return events[dateString] || [];
  };

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.weekDaysRow}>
        {weekDays.map((day, index) => {
          const { date, isToday } = day;
          const dateEvents = getEventsForDate(date);
          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');

          return (
            <TouchableOpacity 
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.selectedDay,
                isToday && styles.todayCell
              ]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[styles.dayNumber, isSelected && styles.selectedDayText]}>
                {format(date, 'd')}
              </Text>
              
              <View style={styles.eventList}>
                {dateEvents.map((event, i) => (
                  <View key={i} style={styles.eventRow}>
                    {event.type === 'physio' && (
                      <>
                        <Ionicons name="pulse" size={10} color="#10B981" />
                        <Text numberOfLines={1} style={styles.physioEvent}>{event.title}</Text>
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

export default CalendarView;

const styles = StyleSheet.create({
  calendarContainer: {
    marginBottom: moderateScale(15),
  },
  weekDaysRow: {
    flexDirection: 'row',
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
    justifyContent: 'center',
    alignItems: 'center',
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
  physioEvent: {
    color: '#10B981',
    fontSize: moderateScale(10),
    marginLeft: moderateScale(2),
    flex: 1,
  },
}); 