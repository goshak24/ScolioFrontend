import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';

const DateNavigator = ({ date, onPrevious, onNext }) => {
  // Format date to display in a more readable format
  const formatDate = (dateString) => {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const displayDate = formatDate(date);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButton} onPress={onPrevious}>
        <Ionicons name="chevron-back" size={moderateScale(24)} color={COLORS.white} />
      </TouchableOpacity>
      
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{displayDate}</Text>
      </View>
      
      <TouchableOpacity style={styles.navButton} onPress={onNext}>
        <Ionicons name="chevron-forward" size={moderateScale(24)} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
};

export default DateNavigator;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
  },
  navButton: {
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.accentOrange,
  },
  timeOfDayText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginTop: moderateScale(2),
  },
});
