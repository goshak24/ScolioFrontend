import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import GradientBackground from '../reusable/GradientBackground';

const ActivitiesSelector = ({ selectedActivities, onToggleActivity }) => {
  const activities = [
    { id: 'school', label: 'School' },
    { id: 'sitting', label: 'Sitting' },
    { id: 'walking', label: 'Walking' },
    { id: 'exercise', label: 'Exercise' },
    { id: 'brace-wear', label: 'Brace Wear' },
    { id: 'work', label: 'Work' },
    { id: 'menstruation', label: 'Menstruation' },
    { id: 'computer', label: 'Computer' },
    { id: 'carrying-bag', label: 'Carrying Bag' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Activities Today</Text>
      <View style={styles.activitiesContainer}>
        {activities.map((activity) => (
          <GradientBackground
            key={activity.id}
            isActive={selectedActivities.includes(activity.id)}
            style={styles.activityWrapper}
          >
            <TouchableOpacity
              style={[
                styles.activityButton,
                selectedActivities.includes(activity.id) && styles.selectedActivity
              ]}
              onPress={() => onToggleActivity(activity.id)}
            >
              <Text 
                style={[
                  styles.activityText,
                  selectedActivities.includes(activity.id) && styles.selectedActivityText
                ]}
              >
                {activity.label}
              </Text>
            </TouchableOpacity>
          </GradientBackground>
        ))}
      </View>
    </View>
  );
};

export default ActivitiesSelector;

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
  activitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: moderateScale(-3),
  },
  activityWrapper: {
    margin: moderateScale(3),
    borderRadius: moderateScale(15),
  },
  activityButton: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(15),
    borderWidth: 1,
    borderColor: '#2A2E43',
  },
  selectedActivity: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  activityText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  selectedActivityText: {
    color: COLORS.white,
  }
});
