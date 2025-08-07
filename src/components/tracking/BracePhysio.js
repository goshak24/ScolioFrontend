import { StyleSheet, View } from 'react-native';
import React from 'react';
import BracePhysioTab from './BracePhysioTab';
import COLORS from '../../constants/COLORS'; 
import { moderateScale } from 'react-native-size-matters';

const BracePhysio = ({ 
  workouts, 
  weeklySchedule, 
  braceData, 
  wearingSchedule, 
  customHeader, 
  onActivityCompleteBrace, 
  onActivityCompletePhysio, 
  onBadgeEarned = () => {},
  showSuccess, 
  successMessage,
  isStreakAnimationActive = false,
  isProcessingActivity = false,
  onNewBadgeEarned = () => {} 
}) => {
  return (
    <View style={styles.container}>
      <BracePhysioTab 
        workouts={workouts} 
        weeklySchedule={weeklySchedule}
        braceData={braceData}
        wearingSchedule={wearingSchedule}
        customHeader={customHeader} 
        onActivityCompleteBrace={onActivityCompleteBrace} 
        onActivityCompletePhysio={onActivityCompletePhysio}
        onBadgeEarned={onBadgeEarned}
        showSuccess={showSuccess}
        successMessage={successMessage}
        isStreakAnimationActive={isStreakAnimationActive}
        isProcessingActivity={isProcessingActivity}
        onNewBadgeEarned={onNewBadgeEarned}
      />
    </View>
  );
};

export default BracePhysio;

const styles = StyleSheet.create({
  container: {
    marginTop: moderateScale(15),
    flex: 1,
    backgroundColor: COLORS.darkBackground
  },
});