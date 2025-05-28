import React, { useState, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../reusable/HeightSpacer';
import TaskItem from './TaskItem';
import TaskManagementModal from '../tracking/TaskManagementModal';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';

const RecoveryChecklist = ({ tasks, onToggleTask }) => {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const { addCustomTask, deleteCustomTask, editCustomTask } = useContext(PostSurgeryContext);
  
  const completedTasks = tasks.filter(task => task.completed).length;

  const handleAddTask = async (taskData) => {
    const result = await addCustomTask(taskData);
    if (result.success) {
      console.log('Task added successfully');
    } else {
      console.error('Error adding task:', result.error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const result = await deleteCustomTask(taskId);
    if (result.success) {
      console.log('Task deleted successfully');
    } else {
      console.error('Error deleting task:', result.error);
    }
  };

  const handleEditTask = async (taskId, taskData) => {
    const result = await editCustomTask(taskId, taskData);
    if (result.success) {
      console.log('Task edited successfully');
    } else {
      console.error('Error editing task:', result.error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons
            name="checkmark-circle-outline"
            size={moderateScale(20)}
            color={COLORS.text}
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>Recovery Checklist</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={() => setShowTaskModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.primaryPurple, COLORS.gradientPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.manageButtonGradient}
          >
            <Ionicons name="settings-outline" size={moderateScale(16)} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
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

      <TaskManagementModal
        visible={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        recoveryTasks={tasks}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onEditTask={handleEditTask}
      />
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
    justifyContent: 'space-between',
    marginBottom: moderateScale(12)
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  cardIcon: {
    marginRight: moderateScale(8)
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text
  },
  manageButton: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
  },
  manageButtonGradient: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
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