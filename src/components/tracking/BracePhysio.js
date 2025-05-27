import { StyleSheet, View } from 'react-native';
import React from 'react';
import BracePhysioTab from './BracePhysioTab';
import COLORS from '../../constants/COLORS'; 
import { moderateScale } from 'react-native-size-matters';

const BracePhysio = ({ workouts, weeklySchedule, braceData, wearingSchedule, customHeader }) => {
  return (
    <View style={styles.container}>
      <BracePhysioTab 
        workouts={workouts} 
        weeklySchedule={weeklySchedule}
        braceData={braceData}
        wearingSchedule={wearingSchedule}
        customHeader={customHeader}
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