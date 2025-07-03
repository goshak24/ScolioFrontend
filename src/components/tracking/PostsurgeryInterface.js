import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeightSpacer from '../reusable/HeightSpacer';
import PostSurgeryTab from './PostSurgeryTab';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';
import { Context as UserContext } from '../../context/UserContext';

// Default recovery tasks
const defaultRecoveryTasks = [
  { id: 1, label: 'Take pain medication', frequency: 'Every 6 hours', completed: false },
  { id: 2, label: 'Change dressing', frequency: 'Daily', completed: false },
  { id: 3, label: 'Walk around the house', frequency: '3-4 times daily', completed: false },
  { id: 4, label: 'Do breathing exercises', frequency: 'Every 2 hours', completed: false },
  { id: 5, label: 'Check incision for signs of infection', frequency: 'Daily', completed: false },
];

// Storage keys not used yet but could be used for future reference 
const TASKS_STORAGE_KEY = 'recoveryTasks';
const LAST_RESET_DATE_KEY = 'lastRecoveryTasksResetDate';
const WALKING_MINUTES_KEY = 'walkingMinutes';
const SURGERY_DATE_KEY = 'surgeryDate';

const PostsurgeryInterface = ({ surgeryData = {}, physioData = {}, showSuccess, successMessage, onActivityCompletePhysio, onActivityCompleteTasks }) => {
  const { 
    state: { recoveryTasks, walkingMinutes, loading }, 
    loadRecoveryData, 
    updateRecoveryTasks,
    incrementWalkingMinutes,
    fetchWalkingData
  } = useContext(PostSurgeryContext);
  
  const { state: { user } } = useContext(UserContext);
  
  const [daysSinceSurgery, setDaysSinceSurgery] = useState(0);
  const [actualSurgeryDate, setActualSurgeryDate] = useState('02/01/2024');

  // Extract workout data for physio tab
  const workouts = physioData?.exercises || [];
  const weeklySchedule = physioData?.weeklySchedule || [];
  
  // Calculate days since surgery based on the surgery date
  const calculateDaysSinceSurgery = (dateStr) => {
    try {
      // Parse the date string (format: DD/MM/YYYY)
      const [day, month, year] = dateStr.split('/').map(Number);
      
      // Create date objects for today and surgery date
      // Month is 0-indexed in JavaScript Date
      const surgeryDay = new Date(year, month - 1, day);
      const today = new Date();
      
      // Reset hours to compare dates only
      surgeryDay.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      // Calculate the time difference in milliseconds
      const timeDifference = today.getTime() - surgeryDay.getTime();
      
      // Convert time difference to days
      const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
      
      // Return days since surgery (minimum 0)
      return Math.max(0, daysDifference);
    } catch (error) {
      console.error("Error calculating days since surgery:", error);
      return 0;
    }
  };

  // Load saved data on mount and fetch walking data immediately
  useEffect(() => {
    const loadData = async () => {
      try {
        // First load all recovery data (which might also reset walking minutes if it's a new day)
        await loadRecoveryData();
        
        // Then specifically fetch the latest walking data from Firebase
        // This will also check if it's a new day and reset if needed
        await fetchWalkingData();
        
        console.log('Walking data loaded with minutes:', walkingMinutes);
      } catch (error) {
        console.error('Error loading postsurgery data:', error);
      }
    };
    
    loadData();
  }, []); 
  
  // Get surgery date from user data and update days since surgery
  useEffect(() => {
    // Extract surgery date from user data if available
    if (user?.treatmentData?.surgery?.surgeryDate || user?.treatmentData?.surgery?.date) {
      const surgeryDateFromUser = user.treatmentData.surgery.surgeryDate || user.treatmentData.surgery.date;
      
      // Only update if the date has changed
      if (surgeryDateFromUser !== actualSurgeryDate) {
        setActualSurgeryDate(surgeryDateFromUser);
        
        // Calculate days since surgery
        const calculatedDays = calculateDaysSinceSurgery(surgeryDateFromUser);
        setDaysSinceSurgery(calculatedDays);
        
        console.log(`Surgery date from user data: ${surgeryDateFromUser}, days since: ${calculatedDays}`);
      }
    } else {
      console.log('No surgery date found in user data');
    }
  }, [user, actualSurgeryDate]);

  // Toggle task completion
  const handleToggleTask = (taskId) => {
    // First update the tasks in the context
    updateRecoveryTasks(taskId);
    
    // Then call the callback with the taskId to trigger streak update logic
    if (onActivityCompleteTasks) {
      onActivityCompleteTasks(taskId);
    }
  };

  return (
    <View style={styles.container}>
      <PostSurgeryTab 
        workouts={workouts}
        weeklySchedule={weeklySchedule}
        recoveryTasks={recoveryTasks} 
        walkingMinutes={walkingMinutes}
        handleToggleTask={handleToggleTask}
        daysSinceSurgery={daysSinceSurgery}
        surgeryDate={actualSurgeryDate}
        showSuccess={showSuccess}
        successMessage={successMessage}
        onActivityCompletePhysio={onActivityCompletePhysio}
      />
    </View>
  );
};

export default PostsurgeryInterface;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: moderateScale(15),
    paddingBottom: moderateScale(25)
  }
});