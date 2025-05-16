import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS'; 

const BackButton = ({ 
  onPress,
  iconColor = COLORS.lightGray,
  buttonColor = COLORS.cardDark,
  size = moderateScale(24),
  padding = moderateScale(8),
  iconName = 'chevron-back', 
  top = verticalScale(40), 
  position = 'absolute'
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: buttonColor,
          padding: padding,
          borderRadius: size, 
          top: top, 
          position: position
        }
      ]}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
    >
      <Ionicons 
        name={iconName} 
        size={size} 
        color={iconColor} 
      />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: verticalScale(40), // Matches typical status bar height
    left: moderateScale(20), // Standard padding
    zIndex: 1, // Ensures it stays above other content
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
}); 