import React, { useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import { Context as PostSurgeryContext } from '../../context/PostSurgeryContext';

const DailyWalkingCard = ({ 
  minutes, 
  targetMinutes, 
  onAddMinutes 
}) => {
  const { incrementWalkingMinutes, fetchWalkingData } = useContext(PostSurgeryContext);
  const walkingProgress = minutes / targetMinutes;

  // Handle adding minutes with API call
  const handleAddMinutes = async (increment) => {
    try {
      // Call the context function with error handling
      const result = await incrementWalkingMinutes(increment);
      
      if (!result.success) {
        console.error('Error incrementing walking minutes:', result.error);
      }
    } catch (error) {
      console.error('Failed to increment walking minutes:', error);
      // Fallback to refreshing the data in case of error
      await handleRefresh();
    }
  };

  // Handle refreshing walking data (useful on first load or for troubleshooting)
  const handleRefresh = async () => {
    try {
      const result = await fetchWalkingData();
      if (!result.success) {
        console.error('Error refreshing walking data:', result.error);
      }
    } catch (error) {
      console.error('Failed to refresh walking data:', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Ionicons 
            name="time-outline" 
            size={moderateScale(20)} 
            color={COLORS.text} 
            style={styles.cardIcon}
          />
          <Text style={styles.cardTitle}>Daily Walking</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons 
            name="refresh" 
            size={moderateScale(18)} 
            color={COLORS.lightGray} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.progressText}>Today's progress</Text>
      <ProgressBar
        progress={walkingProgress}
        color={COLORS.accentGreen}
        style={styles.progressBar}
      />
      <Text style={styles.minutesText}>{minutes}/{targetMinutes} minutes</Text>

      <View style={styles.quickAddRow}>
        <TouchableOpacity 
          style={styles.quickAddButton} 
          onPress={() => handleAddMinutes(5)}
        >
          <Text style={styles.quickAddText}>+5 min</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAddButton} 
          onPress={() => handleAddMinutes(10)}
        >
          <Text style={styles.quickAddText}>+10 min</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAddButton}
          onPress={() => handleAddMinutes(15)}
        >
          <Text style={styles.quickAddText}>+15 min</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.walkingTip}>Remember to walk slowly and use support if needed. Quality over quantity!</Text>
    </View>
  );
};

export default DailyWalkingCard;

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
  },
  cardIcon: {
    marginRight: moderateScale(8)
  },
  refreshButton: {
    padding: moderateScale(5),
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
  minutesText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    alignSelf: 'flex-end',
    marginTop: moderateScale(4),
    marginBottom: moderateScale(10)
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: moderateScale(10)
  },
  quickAddButton: {
    backgroundColor: COLORS.timerBackground,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: COLORS.primaryPurple,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: moderateScale(4)
  },
  quickAddText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14)
  },
  walkingTip: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    fontStyle: 'italic',
    marginTop: moderateScale(10)
  }
}); 