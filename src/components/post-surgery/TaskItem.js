import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';

const TaskItem = ({ task, onToggle }) => {
  return (
    <TouchableOpacity 
      style={styles.taskItem} 
      onPress={() => onToggle(task.id)}
      activeOpacity={0.7}
    >
      <View style={styles.taskCheckContainer}>
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={moderateScale(24)}
          color={task.completed ? COLORS.accentGreen : COLORS.lightGray}
        />
      </View>
      <View style={styles.taskContent}>
        <Text style={[
          styles.taskLabel, 
          task.completed && styles.completedTaskLabel
        ]}>
          {task.label}
        </Text>
        <Text style={styles.taskFrequency}>{task.frequency}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default TaskItem;

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(10),
    padding: moderateScale(12),
    marginBottom: moderateScale(8)
  },
  taskCheckContainer: {
    marginRight: moderateScale(12),
    alignSelf: 'center'
  },
  taskContent: {
    flex: 1
  },
  taskLabel: {
    fontSize: moderateScale(16),
    color: COLORS.white,
    marginBottom: moderateScale(2)
  },
  completedTaskLabel: {
    textDecorationLine: 'line-through',
    color: COLORS.lightGray
  },
  taskFrequency: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray
  }
}); 