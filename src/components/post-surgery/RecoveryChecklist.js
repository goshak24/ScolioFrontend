import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../reusable/HeightSpacer';
import TaskItem from './TaskItem';

const RecoveryChecklist = ({ tasks, onToggleTask }) => {
  const completedTasks = tasks.filter(task => task.completed).length;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons 
          name="checkmark-circle-outline" 
          size={moderateScale(20)} 
          color={COLORS.text} 
          style={styles.cardIcon}
        />
        <Text style={styles.cardTitle}>Recovery Checklist</Text>
      </View>
      
      <Text style={styles.progressText}>Completed tasks</Text>
      <ProgressBar
        progress={completedTasks / tasks.length}
        color={COLORS.primaryPurple}
        style={styles.progressBar}
      />
      <Text style={styles.countText}>{completedTasks}/{tasks.length}</Text>

      <HeightSpacer height={moderateScale(10)} />

      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onToggle={onToggleTask}
        />
      ))}
    </View>
  );
};

export default RecoveryChecklist;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(15)
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12)
  },
  cardIcon: {
    marginRight: moderateScale(8)
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text
  },
  progressText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginBottom: moderateScale(8)
  },
  progressBar: {
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  countText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    alignSelf: 'flex-end',
    marginTop: moderateScale(4)
  }
}); 