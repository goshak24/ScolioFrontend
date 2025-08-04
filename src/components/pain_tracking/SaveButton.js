import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import GradientBackground from '../reusable/GradientBackground';

const SaveButton = ({ onPress, isLoading = false }) => {
  return (
    <GradientBackground
      isActive={true}
      style={styles.buttonWrapper}
      gradientColors={[COLORS.accentOrange, '#FF3B30']}
    >
      <TouchableOpacity style={styles.button} onPress={onPress} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.white} style={styles.icon} />
        ) : (
          <Ionicons name="save-outline" size={moderateScale(18)} color={COLORS.white} style={styles.icon} />
        )}
        <Text style={styles.text}>{isLoading ? 'Saving...' : 'Save'}</Text>
      </TouchableOpacity>
    </GradientBackground>
  );
};

export default SaveButton;

const styles = StyleSheet.create({
  buttonWrapper: {
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(15),
    marginVertical: moderateScale(15),
  },
  button: {
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: moderateScale(10),
  },
  text: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  icon: {
    marginRight: moderateScale(8)
  }
});
