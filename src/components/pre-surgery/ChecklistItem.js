import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';

const ChecklistItem = ({ item, onToggle }) => {
  return (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => onToggle(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.taskRow}>
        <Ionicons
          name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={moderateScale(20)}
          color={item.completed ? COLORS.accentGreen : COLORS.lightGray}
          style={styles.icon}
        />
        <Text style={[styles.taskLabel, item.completed && styles.completedTask]}>
          {item.label}
        </Text>
      </View>
      <Text style={styles.deadlineText}>Deadline: {item.deadline}</Text>
    </TouchableOpacity>
  );
};

export default ChecklistItem;

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: COLORS.workoutOption,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginTop: moderateScale(8),
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  icon: {
    marginRight: moderateScale(8),
  },
  taskLabel: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    flexShrink: 1,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: COLORS.lightGray,
  },
  deadlineText: {
    color: COLORS.accentOrange,
    fontSize: moderateScale(12),
  }
}); 