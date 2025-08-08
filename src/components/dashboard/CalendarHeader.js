import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { moderateScale, scale } from 'react-native-size-matters';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isToday } from 'date-fns';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';
import HeightSpacer from '../reusable/HeightSpacer';
import { navigate } from '../navigation/navigationRef';
import CalendarModal from '../../components/reusable/Calendar/CalendarModal';

const CalendarHeader = ({ profilePic, username, onOpenCalendar }) => {
  const today = new Date();
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Calendar state and modal handled by Dashboard to avoid duplicate modals/fetch loops

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
            {profilePic ? (
            <Image 
              source={{ uri: profilePic }} 
              style={styles.profileIcon}
            />
            ) : (
            <Text style={styles.profileText}>
              {username ? username[0].toUpperCase() : '?'}
            </Text> 
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.monthText}>{format(today, 'MMMM yyyy')}</Text>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={onOpenCalendar}
        >
          <Ionicons name="calendar" size={moderateScale(22)} color={COLORS.white} /> 
        </TouchableOpacity>
      </View>  
      
    </View>
  );
};

export default CalendarHeader;

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: moderateScale(5), 
    paddingBottom: moderateScale(5),
    backgroundColor: COLORS.darkBackground,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(8),
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