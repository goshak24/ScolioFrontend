import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/COLORS';

/**
 * A reusable gradient background wrapper component
 * Simply wraps children in a gradient when isActive is true
 */
const GradientBackground = ({ 
  children, 
  isActive = false,
  style,
  gradientColors = [COLORS.accentOrange, '#FF5733'], // Default orange gradient
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 0 }
}) => {
  if (isActive) {
    return (
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        style={[styles.gradient, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

export default GradientBackground;

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  }
});
