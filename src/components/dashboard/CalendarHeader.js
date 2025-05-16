import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { moderateScale, scale } from 'react-native-size-matters';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';
import HeightSpacer from '../reusable/HeightSpacer';
import { navigate } from '../navigation/navigationRef';
import CalendarModal from '../../components/reusable/Calendar/CalendarModal';

const CalendarHeader = ({ username }) => {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // State for managing calendar modal visibility
  const [modalVisible, setModalVisible] = useState(false);
  // State to store calendar events
  const [events, setEvents] = useState({});

  // Handler for adding events
  const handleEventAdd = (date, eventData) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setEvents(prev => {
      const dateEvents = prev[dateStr] || [];
      return {
        ...prev,
        [dateStr]: [...dateEvents, eventData]
      };
    });
  };

  // Handler for deleting events
  const handleEventDelete = (date, eventIndex) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setEvents(prev => {
      const dateEvents = [...(prev[dateStr] || [])];
      dateEvents.splice(eventIndex, 1);
      
      const newEvents = { ...prev };
      if (dateEvents.length === 0) {
        delete newEvents[dateStr];
      } else {
        newEvents[dateStr] = dateEvents;
      }
      
      return newEvents;
    });
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        {/* Profile Icon */}
        <TouchableOpacity onPress={() => navigate("Profile")}> 
          <LinearGradient 
            colors={["#B15EFF", "#EA6AB5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileIcon}
          >
            <Text style={styles.profileText}>{username[0].toUpperCase()}</Text> 
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.monthText}>{format(today, 'MMMM yyyy')}</Text>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="calendar" size={moderateScale(22)} color={COLORS.white} /> 
        </TouchableOpacity>
      </View>

      <HeightSpacer height={moderateScale(5)} /> 
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.datesContainer}
        overScrollMode="never"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {weekDays.map((day, index) => {
          const isCurrentDay = isToday(day);
          return (
            <View key={index} style={[styles.dayContainer, index === 0 && styles.firstDay, index === weekDays.length - 1 && styles.lastDay]}>
              <Text style={styles.weekDayText}>{format(day, 'EEE')}</Text>
              
              {isCurrentDay ? (
                <LinearGradient 
                  colors={["#A130D3", "#CD298D"]}  
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }} 
                  style={styles.currentDateContainer}
                >
                  <Text style={styles.currentDateText}>{format(day, 'd')}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.dateContainer}>
                  <Text style={styles.dateText}>{format(day, 'd')}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Calendar Modal Implementation */}
      <CalendarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onDateSelect={(date) => console.log('Date selected:', date)}
        events={events}
        initialDate={today}
        onEventAdd={handleEventAdd}
        onEventDelete={handleEventDelete}
        defaultView="month"
      />
    </View>
  );
};

export default CalendarHeader;

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: moderateScale(5), 
    paddingBottom: moderateScale(10),
    backgroundColor: COLORS.backgroundPurple,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  profileIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  monthText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  settingsButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'center', 
    width: '100%', 
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: scale(45),
    paddingHorizontal: moderateScale(2),
  },
  firstDay: {
    marginLeft: moderateScale(8),
  },
  lastDay: {
    marginRight: moderateScale(8),
  },
  weekDayText: {
    fontSize: moderateScale(12),
    color: COLORS.white,
    marginBottom: moderateScale(4),
    textTransform: 'uppercase',
  },
  dateContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentDateContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateText: {
    fontSize: moderateScale(14),
    color: COLORS.white,
  },
  currentDateText: {
    fontWeight: 'bold',
    color: COLORS.white,
  },
});