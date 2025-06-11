import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Vibration, Dimensions } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/COLORS';

/**
 * A popup animation component for new badge achievements
 * @param {Object} props
 * @param {boolean} props.visible - Whether the popup should be visible
 * @param {Object} props.badge - The badge data object
 * @param {number} props.duration - Animation duration in ms (default: 4000)
 * @param {Function} props.onAnimationComplete - Callback when animation completes
 * @param {boolean} props.enableVibration - Enable haptic feedback (default: true)
 */
const NewBadgePopup = ({
  visible = false,
  badge = null,
  duration = 4000,
  onAnimationComplete = () => {},
  enableVibration = true,
}) => { 

  // Animation values
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const triggerVibration = () => {
    if (enableVibration) {
      Vibration.vibrate([0, 200, 100, 300]);
    }
  };

  useEffect(() => { 
    if (visible && badge) {
      console.log("Starting badge popup animation");
      // Trigger haptic feedback
      triggerVibration();

      // Reset animations
      slideAnim.setValue(Dimensions.get('window').height);
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      glowAnim.setValue(0);

      // Create animation sequence
      Animated.parallel([
        // Slide up animation
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: duration * 0.3,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        
        // Scale animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: duration * 0.2,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration * 0.1,
            easing: Easing.elastic(1),
            useNativeDriver: true,
          }),
        ]),
        
        // Fade in
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.2,
          useNativeDriver: true,
        }),
        
        // Glow effect
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.6,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        // Hold for a moment then slide down
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: Dimensions.get('window').height,
              duration: duration * 0.3,
              easing: Easing.in(Easing.back(1.5)),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onAnimationComplete();
          });
        }, duration * 0.4);
      });
    }
  }, [visible, badge, duration, onAnimationComplete]);

  if (!visible || !badge) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Background glow effect */}
      <Animated.View
        style={[
          styles.glowBackground,
          {
            opacity: glowAnim,
          },
        ]}
      />

      {/* Badge content */}
      <View style={styles.badgeCard}>
        <View style={styles.badgeIcon}>
          <Ionicons name="trophy" size={moderateScale(28)} color="white" />
        </View>
        <Text style={styles.badgeTitle}>{badge.name}</Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: moderateScale(20),
    left: moderateScale(20),
    right: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glowBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(15),
    backgroundColor: COLORS.primaryPurple,
    opacity: 0.2,
    shadowColor: COLORS.primaryPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeCard: {
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(15),
    padding: moderateScale(20),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: COLORS.primaryPurple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  badgeTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: moderateScale(5),
  },
  badgeDescription: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});

export default NewBadgePopup;
