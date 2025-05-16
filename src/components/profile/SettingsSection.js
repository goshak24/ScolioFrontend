import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const SettingsSection = ({ title, children }) => {
  return (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

export default SettingsSection;

const styles = StyleSheet.create({
  settingsSection: {
    marginBottom: moderateScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(15),
  },
  sectionContent: {
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
}); 