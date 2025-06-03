import { View, Text, StyleSheet } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import { Context as UserContext } from '../../context/UserContext';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';
import { Context as PreSurgeryContext } from '../../context/PreSurgeryContext';
import { ProgressBar } from 'react-native-paper';
import HeightSpacer from '../reusable/HeightSpacer'; 

const SurgeryProgressCard = () => {
  const { state: { user } } = useContext(UserContext);
  const { 
    state: { recoveryTasks, walkingMinutes },
    loadRecoveryData
  } = useContext(PostSurgeryContext);
  const {
    state: { checklistItems, plannedSurgeryDate },
    loadPreSurgeryData
  } = useContext(PreSurgeryContext);
  
  const accType = user?.acc_type?.toLowerCase() || '';
  const isPreSurgery = accType === 'presurgery' || accType === 'pre-surgery';
  const isPostSurgery = accType === 'postsurgery' || accType === 'post-surgery';
  
  const [daysSince, setDaysSince] = useState(0);
  const [daysUntil, setDaysUntil] = useState(0);
  const [actualSurgeryDate, setActualSurgeryDate] = useState('');
  
  // Calculate days until or since surgery
  const calculateSurgeryDays = () => {
    if (isPreSurgery) {
      return { days: daysUntil, label: "Days until surgery" };
    } else if (isPostSurgery) {
      return { days: daysSince, label: "Days since surgery" };
    } else {
      return { days: 0, label: "Days" };
    }
  };

  // Calculate days until surgery based on the planned surgery date
  const calculateDaysUntilSurgery = (dateStr) => {
    try {
      // Parse the date string (format: DD/MM/YYYY)
      const [day, month, year] = dateStr.split('/').map(Number);
      
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
      
      // Return days until surgery (minimum 0)
      const result = Math.max(0, daysDifference);
      return result;
    } catch (error) {
      console.error("Error calculating days until surgery:", error);
      return 14; // Default to 14 days if calculation fails
    }
  };

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
  
  // Update days since surgery from user data
  useEffect(() => {
    if (isPostSurgery && user?.treatmentData?.surgery?.date) {
      const surgeryDateFromUser = user.treatmentData.surgery.date;
      // Only update if the date has changed
      if (surgeryDateFromUser !== actualSurgeryDate) {
        setActualSurgeryDate(surgeryDateFromUser);
        const calculatedDaysSince = calculateDaysSinceSurgery(surgeryDateFromUser);
        setDaysSince(calculatedDaysSince);
        console.log(`Surgery date from user data: ${surgeryDateFromUser}, days since: ${calculatedDaysSince}`);
      }
    }
  }, [isPostSurgery, user, actualSurgeryDate]);

  // Update days until surgery when planned surgery date changes
  useEffect(() => {
    if (isPreSurgery && plannedSurgeryDate) {
      const calculatedDaysUntil = calculateDaysUntilSurgery(plannedSurgeryDate);
      setDaysUntil(calculatedDaysUntil);
    }
  }, [isPreSurgery, plannedSurgeryDate]);
  
  // Load data from context when component mounts
  useEffect(() => {
    if (isPostSurgery) {
      // Load post-surgery data from context
      loadRecoveryData();
    } else if (isPreSurgery) {
      // Load pre-surgery data from context
      loadPreSurgeryData();
    }
  }, [isPreSurgery, isPostSurgery]);
  
  const surgeryDaysInfo = calculateSurgeryDays();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name={isPreSurgery ? "calendar-outline" : "fitness-outline"} 
            size={moderateScale(20)} 
            color={COLORS.primaryPurple} 
          />
          <Text style={styles.title}>
            {isPreSurgery ? "Surgery Preparation" : "Recovery Progress"}
          </Text>
        </View>
        <View style={styles.daysBadge}>
          <Text style={styles.daysText}>{surgeryDaysInfo.days} days</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>{surgeryDaysInfo.label}</Text>
      
      <HeightSpacer height={moderateScale(15)} />
      
      {/* Task completion progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelContainer}>
            <Ionicons name="clipboard-outline" size={moderateScale(16)} color={COLORS.primaryPurple} style={styles.progressIcon} />
            <Text style={styles.progressLabel}>
              {isPreSurgery ? "Pre-op Tasks" : "Recovery Tasks"}
            </Text>
          </View>
          <Text style={styles.progressCount}>
            {isPreSurgery ? 
              `${checklistItems.filter(task => task.completed).length}/${checklistItems.length}` : 
              `${recoveryTasks.filter(task => task.completed).length}/${recoveryTasks.length}`
            }
          </Text>
        </View>
        <ProgressBar 
          progress={
            isPreSurgery 
              ? (checklistItems.length ? checklistItems.filter(task => task.completed).length / checklistItems.length : 0)
              : (recoveryTasks.length ? recoveryTasks.filter(task => task.completed).length / recoveryTasks.length : 0)
          }
          color={COLORS.gradientPurple}
          style={styles.progressBar}
        />
      </View>
      
      {/* Walking progress (post-surgery only) */}
      {isPostSurgery && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLabelContainer}>
              <Ionicons name="walk-outline" size={moderateScale(16)} color={COLORS.accentGreen} style={styles.progressIcon} />
              <Text style={styles.progressLabel}>Daily Walking</Text>
            </View>
            <Text style={styles.progressCount}>{walkingMinutes}/30 min</Text>
          </View>
          <ProgressBar 
            progress={walkingMinutes / 30}
            color="#56C596"
            style={styles.progressBar}
          />
        </View>
      )}
      
      {/* Surgery info (pre-surgery only) */}
      {isPreSurgery && (
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>
            Your surgery is scheduled for: <Text style={styles.infoValue}>{plannedSurgeryDate}</Text>
          </Text>
        </View>
      )} 
    </View>
  );
};

export default SurgeryProgressCard;

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(7.5),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: moderateScale(8),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  daysBadge: {
    backgroundColor: COLORS.primaryPurple,
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
  },
  daysText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(12),
  },
  progressSection: {
    marginBottom: moderateScale(12),
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIcon: {
    marginRight: moderateScale(6),
  },
  progressLabel: {
    fontSize: moderateScale(14),
    color: COLORS.white,
  },
  progressCount: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  progressBar: {
    height: verticalScale(8),
    borderRadius: 10,
    backgroundColor: COLORS.progressBackground,
  },
  infoSection: {
    backgroundColor: COLORS.progressBackground,
    padding: moderateScale(10),
    borderRadius: moderateScale(8), 
  },
  infoLabel: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
  },
  infoValue: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
}); 