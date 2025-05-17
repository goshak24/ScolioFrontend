import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

/**
 * A reusable gradient button component
 * @param {Object} props
 * @param {string} props.text - Button text
 * @param {function} props.onPress - Button press handler
 * @param {boolean} props.isSelected - Whether button is selected
 * @param {Object} props.icon - Optional icon component to display
 * @param {Object} props.style - Additional style for the button container
 * @param {Object} props.textStyle - Additional style for button text
 */
const GradientButton = ({ 
  text, 
  onPress, 
  isSelected = false, 
  icon, 
  style,
  textStyle,
  gradientColors = [COLORS.accentOrange, '#FF5733'], // Default orange gradient
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 }
}) => {
  if (isSelected) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.buttonContainer, style]}>
        <LinearGradient
          colors={gradientColors}
          start={gradientStart}
          end={gradientEnd}
          style={styles.gradientButton}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.selectedButtonText, textStyle]}>{text}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[styles.buttonContainer, styles.unselectedButton, style]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.unselectedButtonText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

export default GradientButton;

const styles = StyleSheet.create({
  buttonContainer: {
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    marginHorizontal: moderateScale(3),
  },
  gradientButton: {
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  unselectedButton: {
    backgroundColor: COLORS.darkBackground,
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  unselectedButtonText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  iconContainer: {
    marginRight: moderateScale(6),
  }
});
