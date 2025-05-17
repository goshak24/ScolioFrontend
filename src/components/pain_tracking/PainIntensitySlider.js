import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Slider from '@react-native-community/slider';
import COLORS from '../../constants/COLORS';

const PainIntensitySlider = ({ intensity, setIntensity }) => {
  // Use internal state to track value during dragging
  const [localIntensity, setLocalIntensity] = useState(intensity);
  
  // Convert intensity to display format (e.g. 5/10)
  const displayIntensity = `${Math.round(localIntensity)}/10`;

  // Handle slider complete - only update the parent when sliding is complete
  const handleSlidingComplete = (value) => {
    setIntensity(Math.round(value));
  };

  // Track local changes during sliding
  const handleValueChange = (value) => {
    setLocalIntensity(Math.round(value));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pain Intensity: {displayIntensity}</Text>
      
      <Slider
        style={styles.slider}
        value={localIntensity}
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumValue={0}
        maximumValue={10}
        step={1}
        minimumTrackTintColor={COLORS.accentOrange}
        maximumTrackTintColor="#FFFFFF33"
        thumbTintColor="#FFFFFF"
      />
      
      <View style={styles.labelsContainer}>
        <Text style={styles.levelLabel}>No Pain</Text>
        <Text style={styles.levelLabel}>Mild</Text>
        <Text style={styles.levelLabel}>Moderate</Text>
        <Text style={styles.levelLabel}>Severe</Text>
        <Text style={styles.levelLabel}>Extreme</Text>
      </View>
    </View>
  );
};

export default PainIntensitySlider;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(20),
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
