import { StyleSheet, ScrollView } from 'react-native'
import React, { useState, useEffect, useContext } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { moderateScale } from 'react-native-size-matters'
import HeightSpacer from '../reusable/HeightSpacer'
import {
  DaysUntilCard,
  SurgeryChecklist,
  SurgeryInfo
} from '../pre-surgery'
import { Context as PreSurgeryContext } from '../../context/PreSurgeryContext'

// Default checklist items
const defaultChecklistItems = [
  { id: 1, label: 'Complete pre-op blood work', deadline: 'ASAP', completed: false },
  { id: 2, label: 'Meet with anesthesiologist', deadline: '5 days before', completed: false },
  { id: 3, label: 'Stop taking NSAIDs', deadline: '7 days before', completed: false },
  { id: 4, label: 'Prepare recovery area at home', deadline: '3 days before', completed: false },
  { id: 5, label: 'Pack hospital bag', deadline: '1 day before', completed: false },
  { id: 6, label: 'Shower with antibacterial soap', deadline: 'Night before', completed: false },
]

// Storage keys
const CHECKLIST_STORAGE_KEY = 'presurgeryChecklist'; 
const PLANNED_SURGERY_DATE_KEY = 'plannedSurgeryDate';

// Function to calculate days between two dates
const calculateDaysDifference = (plannedDateStr) => {
  // Parse the date string (format: DD/MM/YYYY)
  const [day, month, year] = plannedDateStr.split('/').map(Number);
  
  // Create date objects for today and planned date
  // Month is 0-indexed in JavaScript Date
  const plannedDate = new Date(year, month - 1, day);
  const today = new Date();
  
  // Reset hours to compare dates only
  plannedDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Calculate the time difference in milliseconds
  const timeDifference = plannedDate.getTime() - today.getTime();
  
  // Convert time difference to days
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  
  // Return 0 if negative (surgery date has passed)
  return Math.max(0, daysDifference);
};

const PresurgeryInterface = ({ surgeryData = {} }) => {
  const { 
    state: { checklistItems, plannedSurgeryDate, loading },
    loadPreSurgeryData,
    updateChecklistItems,
    setPlannedSurgeryDate
  } = useContext(PreSurgeryContext);
  
  // Get surgery data with defaults if not provided
  const [surgeryTime, setSurgeryTime] = useState(surgeryData?.time || '8:00 AM');
  const [hospital, setHospital] = useState(surgeryData?.hospital || 'Memorial Spine Center');
  const [surgeon, setSurgeon] = useState(surgeryData?.surgeon || 'Dr. Sarah Johnson');
  const [procedure, setProcedure] = useState(surgeryData?.procedure || 'Posterior Spinal Fusion T10–L2');
  
  // Calculate days until surgery
  const [daysUntilSurgery, setDaysUntilSurgery] = useState(0);
  
  // Calculate days until surgery and update state
  useEffect(() => {
    const days = calculateDaysDifference(plannedSurgeryDate);
    setDaysUntilSurgery(days);
  }, [plannedSurgeryDate]);
  
  // Load saved data on mount
  useEffect(() => {
    loadPreSurgeryData();
    
    // If surgeryData has a plannedDate, update it
    if (surgeryData?.plannedDate) {
      setPlannedSurgeryDate(surgeryData.plannedDate);
    }
  }, []);

  // Toggle task completion
  const handleToggleTask = (taskId) => {
    const updatedChecklist = checklistItems.map(item => 
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );
    updateChecklistItems(updatedChecklist);
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      <DaysUntilCard days={daysUntilSurgery} />

      <HeightSpacer height={moderateScale(15)} />

      <SurgeryChecklist 
        items={checklistItems} 
        onToggleItem={handleToggleTask}
      />

      <HeightSpacer height={moderateScale(15)} />

      <SurgeryInfo
        date={plannedSurgeryDate}
        time={surgeryTime}
        hospital={hospital}
        surgeon={surgeon}
        procedure={procedure}
      />
      
      <HeightSpacer height={moderateScale(25)} />
    </ScrollView>
  )
}

export default PresurgeryInterface

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: moderateScale(15),
    paddingBottom: moderateScale(25)
  }
})
  