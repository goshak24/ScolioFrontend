import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS';

/**
 * A reusable animation component for streak extensions
 * @param {Object} props
 * @param {boolean} props.visible - Whether the animation should be visible
 * @param {string} props.message - Custom message to display (default: "Streak Extended!")
 * @param {number} props.duration - Animation duration in ms (default: 4000)
 * @param {Function} props.onAnimationComplete - Callback when animation completes
 * @param {Object} props.style - Additional styles for the container
 */
const StreakExtensionAnimation = ({ 
  visible = false, 
  message = "Streak Extended!", 
  duration = 4000,
  onAnimationComplete = () => {},
  style = {}
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      starAnim.setValue(0);

      // Create animation sequence
      Animated.parallel([
        // Main container animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: duration * 0.3,
            easing: Easing.elastic(1),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration * 0.2,
            useNativeDriver: true,
          }),
        ]),
        
        // Opacity animation
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.2,
          useNativeDriver: true,
        }),
        
        // Rotation animation for stars
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
        
        // Star scaling animation
        Animated.sequence([
          Animated.timing(starAnim, {
            toValue: 1,
            duration: duration * 0.3,
            easing: Easing.elastic(1),
            useNativeDriver: true,
          }),
          Animated.timing(starAnim, {
            toValue: 0.8,
            duration: duration * 0.5,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Fade out animation
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration * 0.3,
          delay: duration * 0.5,
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      });
    }
  }, [visible, duration, onAnimationComplete]);

  // Don't render anything if not visible
  if (!visible) return null;

  // Calculate rotation for the stars
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        style,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Stars animation */}
        <View style={styles.starsContainer}>
          {[...Array(5)].map((_, i) => (
            <Animated.Text 
              key={i} 
              style={[
                styles.star,
                {
                  transform: [
                    { scale: starAnim },
                    { rotate },
                    { translateX: 30 * Math.cos(i * Math.PI / 2.5) },
                    { translateY: 30 * Math.sin(i * Math.PI / 2.5) },
                  ],
                },
              ]}
            >
              ⭐
            </Animated.Text>
          ))}
        </View>
        
        {/* Message */}
        <Text style={styles.message}>{message}</Text>
        
        {/* Flame emoji for streak */}
        <Text style={styles.emoji}>🔥</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  contentContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  message: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: moderateScale(10),
    textAlign: 'center',
  },
  emoji: {
    fontSize: moderateScale(40),
    marginTop: moderateScale(10),
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    fontSize: moderateScale(20),
  },
});

export default StreakExtensionAnimation; 