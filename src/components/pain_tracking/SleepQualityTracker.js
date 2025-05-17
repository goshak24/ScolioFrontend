import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Slider from '@react-native-community/slider';
import COLORS from '../../constants/COLORS';

const SleepQualityTracker = ({ sleepQuality, setSleepQuality }) => {
  // Use internal state to track value during dragging
  const [localQuality, setLocalQuality] = useState(sleepQuality);

  // Convert sleep quality to display format (e.g. 5/10)
  const displayQuality = `${Math.round(localQuality)}/10`;

  // Handle slider complete - only update the parent when sliding is complete
  const handleSlidingComplete = (value) => {
    setSleepQuality(Math.round(value));
  };

  // Track local changes during sliding
  const handleValueChange = (value) => {
    setLocalQuality(Math.round(value));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sleep Quality Last Night: {displayQuality}</Text>
      
      <Slider
        style={styles.slider}
        value={localQuality}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumValue={0}
        maximumValue={10}
        step={1}
        minimumTrackTintColor="#8b5cf6" // Purple color for sleep
        maximumTrackTintColor="#FFFFFF33"
        thumbTintColor="#FFFFFF"
      />
      
      <View style={styles.labelsContainer}>
        <Text style={styles.levelLabel}>Poor</Text>
        <Text style={styles.levelLabel}>Fair</Text>
        <Text style={styles.levelLabel}>Good</Text>
        <Text style={styles.levelLabel}>Excellent</Text>
      </View>
    </View>
  );
};

export default SleepQualityTracker;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(15),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: moderateScale(10),
  },
  slider: {
    width: '100%',
    height: moderateScale(40),
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  levelLabel: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
});
