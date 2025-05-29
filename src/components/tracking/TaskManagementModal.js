import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ScrollView
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../reusable/HeightSpacer';

const TaskManagementModal = ({ 
  visible, 
  onClose, 
  recoveryTasks, 
  onAddTask, 
  onDeleteTask, 
  onEditTask 
}) => {
  const [newTaskLabel, setNewTaskLabel] = useState('');
  const [newTaskFrequency, setNewTaskFrequency] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editFrequency, setEditFrequency] = useState('');

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    '3-4 times daily',
    'Every 2 hours',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Weekly',
    'As needed'
  ];

  const handleAddTask = () => {
    if (!newTaskLabel.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!newTaskFrequency.trim()) {
      Alert.alert('Error', 'Please select or enter a frequency');
      return;
    }

    onAddTask({
      label: newTaskLabel.trim(),
      frequency: newTaskFrequency.trim()
    });

    // Clear form
    setNewTaskLabel('');
    setNewTaskFrequency('');
  };

  const handleDeleteTask = (taskId, taskLabel) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${taskLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteTask(taskId)
        }
      ]
    );
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditLabel(task.label);
    setEditFrequency(task.frequency);
  };

  const handleEditTask = () => {
    if (!editLabel.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!editFrequency.trim()) {
      Alert.alert('Error', 'Please select or enter a frequency');
      return;
    }

    onEditTask(editingTask, {
      label: editLabel.trim(),
      frequency: editFrequency.trim()
    });

    // Clear editing state
    setEditingTask(null);
    setEditLabel('');
    setEditFrequency('');
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditLabel('');
    setEditFrequency('');
  };

  const renderFrequencyOption = (option) => (
    <TouchableOpacity
      key={option}
      style={[
        styles.frequencyOption,
        (newTaskFrequency === option || editFrequency === option) && styles.selectedFrequency
      ]}
      onPress={() => {
        if (editingTask) {
          setEditFrequency(option);
        } else {
          setNewTaskFrequency(option);
        }
      }}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.frequencyText,
        (newTaskFrequency === option || editFrequency === option) && styles.selectedFrequencyText
      ]}>
        {option}
      </Text>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item }) => {
    const isDefault = item.id <= 5 || item.isDefault;
    const isEditing = editingTask === item.id;

    if (isEditing) {
      return (
        <View style={styles.taskItem}>
          <View style={styles.editContainer}>
            <Text style={styles.editSectionTitle}>Edit Task</Text>
            <TextInput
              style={styles.editInput}
              value={editLabel}
              onChangeText={setEditLabel}
              placeholder="Task description"
              placeholderTextColor={COLORS.lightGray}
              multiline
            />
            <Text style={styles.sectionTitle}>Frequency:</Text>
            <HeightSpacer height={moderateScale(10)} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScrollView}>
              {frequencyOptions.map(renderFrequencyOption)}
            </ScrollView>
            <TextInput
              style={styles.customFrequencyInput}
              value={editFrequency}
              onChangeText={setEditFrequency}
              placeholder="Or enter custom frequency"
              placeholderTextColor={COLORS.lightGray}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.saveButton} onPress={handleEditTask} activeOpacity={0.8}>
                <LinearGradient
                  colors={[COLORS.accentGreen, '#16a34a']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.taskItem}>
        <View style={styles.taskContent}>
          <Text style={styles.taskLabel}>{item.label}</Text>
          <Text style={styles.taskFrequency}>{item.frequency}</Text>
          {isDefault && <Text style={styles.defaultBadge}>Default</Text>}
        </View>
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={styles.editTaskButton}
            onPress={() => startEditing(item)}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil" size={moderateScale(14)} color={COLORS.white} />
          </TouchableOpacity>
          {
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTask(item.id, item.label)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={moderateScale(14)} color={COLORS.white} />
            </TouchableOpacity>
          }
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primaryPurple, COLORS.gradientPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.title}>Manage Recovery Tasks</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <View style={styles.closeButtonContainer}>
              <Text style={styles.closeButtonText}>Done</Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add New Task Section */}
          <View style={styles.addTaskSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="add-circle" size={moderateScale(20)} color={COLORS.accentGreen} />
              <Text style={styles.sectionTitle}>Add New Task</Text>
            </View>
            
            <TextInput
              style={styles.taskInput}
              value={newTaskLabel}
              onChangeText={setNewTaskLabel}
              placeholder="Enter task description (e.g., Take vitamins)"
              placeholderTextColor={COLORS.lightGray}
              multiline
            />
            
            <Text style={styles.sectionSubTitle}>Frequency:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.frequencyScrollView}>
              {frequencyOptions.map(renderFrequencyOption)}
            </ScrollView>
            
            <TextInput
              style={styles.customFrequencyInput}
              value={newTaskFrequency}
              onChangeText={setNewTaskFrequency}
              placeholder="Or enter custom frequency"
              placeholderTextColor={COLORS.lightGray}
            />
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask} activeOpacity={0.8}>
              <LinearGradient
                colors={[COLORS.accentGreen, '#16a34a']}
                style={styles.buttonGradient}
              >
                <Ionicons name="add" size={moderateScale(16)} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.addButtonText}>Add Task</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Existing Tasks Section */}
          <View style={styles.existingTasksSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={moderateScale(20)} color={COLORS.primaryPurple} />
              <Text style={styles.sectionTitle}>Current Tasks</Text>
            </View>

            <FlatList
              data={recoveryTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.taskSeparator} />}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(50),
    paddingBottom: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  closeButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
  },
  addTaskSection: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    marginTop: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  existingTasksSection: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(20),
    borderRadius: moderateScale(16),
    marginTop: moderateScale(20),
    marginBottom: moderateScale(30),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: moderateScale(8),
  },
  sectionSubTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: moderateScale(12),
    marginTop: moderateScale(8),
  },
  editSectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: moderateScale(12),
  },
  taskInput: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(14),
    marginBottom: moderateScale(16),
    minHeight: moderateScale(80),
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: COLORS.text,
  },
  frequencyScrollView: {
    marginBottom: moderateScale(12),
  },
  frequencyOption: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    marginRight: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  selectedFrequency: {
    backgroundColor: COLORS.primaryPurple,
    borderColor: COLORS.primaryPurple,
  },
  frequencyText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    fontWeight: '500',
  },
  selectedFrequencyText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  customFrequencyInput: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(14),
    marginBottom: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: COLORS.text,
  },
  addButton: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  buttonIcon: {
    marginRight: moderateScale(8),
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  taskItem: {
    paddingVertical: moderateScale(16),
  },
  taskSeparator: {
    height: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginVertical: moderateScale(8),
  },
  taskContent: {
    flex: 1,
    marginBottom: moderateScale(12),
  },
  taskLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: moderateScale(4),
  },
  taskFrequency: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
    marginBottom: moderateScale(6),
  },
  defaultBadge: {
    fontSize: moderateScale(11),
    color: COLORS.primaryPurple,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
    alignSelf: 'flex-start',
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  editTaskButton: {
    backgroundColor: COLORS.primaryPurple,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(40),
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(40),
    alignItems: 'center',
  },
  editContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  editInput: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    fontSize: moderateScale(14),
    marginBottom: moderateScale(16),
    minHeight: moderateScale(60),
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: COLORS.text,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: moderateScale(12),
    marginTop: moderateScale(16),
  },
  saveButton: {
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },
  saveButtonText: {
    color: COLORS.white,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(5),
    fontWeight: 'bold',
    fontSize: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: COLORS.lightGray,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});

export default TaskManagementModal;