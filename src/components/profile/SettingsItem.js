import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';

const SettingItem = ({ 
  icon, 
  label, 
  value, 
  onPress, 
  isSwitch = false, 
  switchValue, 
  onToggle,
  isLast = false 
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.settingItem, 
        !isLast && styles.borderBottom
      ]} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={COLORS.white} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {value && !isSwitch && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.workoutOption, true: COLORS.primaryPurple }}
          thumbColor={switchValue ? COLORS.white : '#f4f3f4'}
        />
      ) : (
        <Ionicons name="chevron-forward" size={22} color={COLORS.lightGray} />
      )}
    </TouchableOpacity>
  );
};

export default SettingItem;

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(15),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingIconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(15),
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: moderateScale(16),
    color: COLORS.white,
  },
  settingValue: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginTop: moderateScale(2),
  },
}); 