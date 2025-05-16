import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';

const DaysSinceCard = ({ days, surgeryDate }) => {
  // Format the date string
  const formatDate = (dateStr) => {
    try {
      // Parse the date string (format: DD/MM/YYYY)
      const [day, month, year] = dateStr.split('/').map(Number);
      
      // Create a date object (Month is 0-indexed in JavaScript Date)
      const date = new Date(year, month - 1, day);
      
      // Format the date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr; // Return original string if parsing fails
    }
  };

  // Get milestone message based on days since surgery
  const getMilestoneMessage = () => {
    if (days < 7) {
      return "Focus on rest and gentle movement";
    } else if (days < 14) {
      return "Start short walks around the house";
    } else if (days < 30) {
      return "Gradually increase walking distance";
    } else if (days < 60) {
      return "Begin light activities as advised";
    } else if (days < 90) {
      return "Continue rehabilitation exercises";
    } else {
      return "Keep up with your therapy routine";
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons 
          name="calendar-outline" 
          size={moderateScale(20)} 
          color={COLORS.text} 
          style={styles.icon}
        />
        <Text style={styles.title}>Recovery Progress</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.dayCounter}>
          <Text style={styles.dayNumber}>{days}</Text>
          <Text style={styles.dayLabel}>Days</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Since surgery</Text>
          <Text style={styles.dateText}>{formatDate(surgeryDate)}</Text>
          <Text style={styles.milestoneText}>{getMilestoneMessage()}</Text>
        </View>
      </View>
    </View>
  );
};

export default DaysSinceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(12)
  },
  icon: {
    marginRight: moderateScale(8)
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dayCounter: {
    backgroundColor: COLORS.primaryPurple,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginRight: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(70)
  },
  dayNumber: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.white
  },
  dayLabel: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    opacity: 0.8
  },
  infoContainer: {
    flex: 1
  },
  infoTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.text
  },
  dateText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginTop: moderateScale(4)
  },
  milestoneText: {
    fontSize: moderateScale(12),
    color: COLORS.accentGreen,
    marginTop: moderateScale(8),
    fontStyle: 'italic'
  }
}); 