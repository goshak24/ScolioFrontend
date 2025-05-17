import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../reusable/GradientBackground';

const TimeOfDaySelector = ({ selectedTime, onSelectTime }) => {
  const timeOptions = [
    { id: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { id: 'afternoon', label: 'Afternoon', icon: 'partly-sunny-outline' },
    { id: 'evening', label: 'Evening', icon: 'moon-outline' },
    { id: 'night', label: 'Night', icon: 'cloudy-night-outline' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Time of Day</Text>
      <View style={styles.optionsContainer}>
        {timeOptions.map((option) => (
          <GradientBackground
            key={option.id}
            isActive={selectedTime === option.id}
            style={styles.timeOptionContainer}
          >
            <TouchableOpacity
              style={[
                styles.timeOption,
                selectedTime === option.id && styles.selectedTimeOption
              ]}
              onPress={() => onSelectTime(option.id)}
            >
              <Ionicons 
                name={option.icon} 
                size={moderateScale(18)} 
                color={selectedTime === option.id ? COLORS.white : COLORS.lightGray} 
              />
              <Text 
                style={[
                  styles.timeLabel,
                  selectedTime === option.id && styles.selectedTimeLabel
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          </GradientBackground>
        ))}
      </View>
    </View>
  );
};

export default TimeOfDaySelector;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(20),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: moderateScale(10),
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  timeOptionContainer: {
    flex: 1,
    marginHorizontal: moderateScale(3),
    borderRadius: moderateScale(10),
  },
  timeOption: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTimeOption: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  timeLabel: {
    marginTop: moderateScale(5),
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  selectedTimeLabel: {
    color: COLORS.white,
    fontWeight: '500',
  },
});
