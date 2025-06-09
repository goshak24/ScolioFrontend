import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Vibration } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
// import Sound from 'react-native-sound'; // Uncomment when you install react-native-sound
import COLORS from '../constants/COLORS';

/**
 * A reusable animation component for streak extensions
 * @param {Object} props
 * @param {boolean} props.visible - Whether the animation should be visible
 * @param {string} props.message - Custom message to display (default: "Streak Extended!")
 * @param {number} props.duration - Animation duration in ms (default: 4000)
 * @param {Function} props.onAnimationComplete - Callback when animation completes
 * @param {Object} props.style - Additional styles for the container
 * @param {boolean} props.enableVibration - Enable haptic feedback (default: true)
 * @param {boolean} props.enableSound - Enable sound effects (default: true)
 */
const StreakExtensionAnimation = ({ 
  visible = false, 
  message = "Streak Extended!", 
  duration = 6000,
  onAnimationComplete = () => {},
  style = {},
  enableVibration = true,
  enableSound = true
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const starAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Sound setup (uncomment when you install react-native-sound)
  /*
  const successSound = useRef(null);
  
  useEffect(() => {
    if (enableSound) {
      successSound.current = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound', error);
        }
      });
    }
    
    return () => {
      if (successSound.current) {
        successSound.current.release();
      }
    };
  }, [enableSound]);
  */

  const playSound = () => {
    if (enableSound) {
      // Uncomment when you have react-native-sound installed
      /*
      if (successSound.current) {
        successSound.current.play();
      }
      */
    }
  };

  const triggerVibration = () => {
    if (enableVibration) {
      // Pattern: [wait, vibrate, wait, vibrate]
      Vibration.vibrate([0, 200, 100, 300]);
    }
  };

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback and sound
      triggerVibration();
      playSound();
      
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      starAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleAnim.setValue(0);
      glowAnim.setValue(0);

      // Create enhanced animation sequence
      Animated.parallel([
        // Main container bounce animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: duration * 0.25,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration * 0.15,
            easing: Easing.elastic(1.2),
            useNativeDriver: true,
          }),
        ]),
        
        // Opacity fade in
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: duration * 0.2,
          useNativeDriver: true,
        }),
        
        // Continuous glow pulse
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        ),
        
        // Star rotation animation
        Animated.timing(rotateAnim, {
          toValue: 2, // Multiple rotations
          duration: duration * 0.9,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        
        // Star scaling with bounce
        Animated.sequence([
          Animated.timing(starAnim, {
            toValue: 1.2,
            duration: duration * 0.2,
            easing: Easing.out(Easing.back(1.8)),
            useNativeDriver: true,
          }),
          Animated.timing(starAnim, {
            toValue: 1,
            duration: duration * 0.3,
            easing: Easing.elastic(1),
            useNativeDriver: true,
          }),
        ]),
        
        // Sparkle effects
        Animated.loop(
          Animated.sequence([
            Animated.timing(sparkleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sparkleAnim, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ),
        
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
        // Fade out animation
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: duration * 0.4,
          delay: duration * 0.3,
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

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        style,
        {
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
            transform: [{ scale: pulseAnim }],
          }
        ]}
      />
      
      {/* Orbiting stars - positioned behind content */}
      <View style={styles.starsContainer}>
        {[...Array(8)].map((_, i) => (
          <Animated.Text 
            key={i} 
            style={[
              styles.star,
              {
                opacity: sparkleOpacity,
                transform: [
                  { scale: starAnim },
                  { rotate },
                  { translateX: 80 * Math.cos(i * Math.PI / 4) },
                  { translateY: 80 * Math.sin(i * Math.PI / 4) },
                ],
              },
            ]}
          >
            {i % 2 === 0 ? '⭐' : '✨'}
          </Animated.Text>
        ))}
      </View>

      {/* Main content container */}
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Flame emoji for streak */}
        <Animated.Text 
          style={[
            styles.emoji,
            {
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          🔥
        </Animated.Text>
        
        {/* Message */}
        <Text style={styles.message}>{message}</Text>
        
        {/* Subtitle */}
        <Text style={styles.subtitle}>Keep it up! 💪</Text>
      </Animated.View>
      
      {/* Additional floating sparkles */}
      <View style={styles.floatingSparkles}>
        {[...Array(12)].map((_, i) => (
          <Animated.Text 
            key={`sparkle-${i}`}
            style={[
              styles.floatingSparkle,
              {
                opacity: sparkleOpacity,
                left: `${10 + (i * 7)}%`,
                top: `${20 + (i % 3) * 20}%`,
                transform: [
                  { 
                    scale: sparkleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    })
                  },
                  { rotate: `${i * 30}deg` }
                ],
              },
            ]}
          >
            ✨
          </Animated.Text>
        ))}
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
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  glowBackground: {
    position: 'absolute',
    width: moderateScale(300),
    height: moderateScale(300),
    borderRadius: moderateScale(150),
    backgroundColor: COLORS.primaryPurple,
    opacity: 0.2,
    shadowColor: COLORS.primaryPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 20,
  },
  contentContainer: {
    borderRadius: moderateScale(25),
    padding: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(250) 
  },
  message: {
    fontSize: moderateScale(26),
    fontWeight: '800',
    color: COLORS.white,
    marginVertical: moderateScale(8),
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.lightPurple,
    textAlign: 'center',
    marginTop: moderateScale(5),
  },
  emoji: {
    fontSize: moderateScale(50),
    marginBottom: moderateScale(10),
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  starsContainer: {
    position: 'absolute',
    width: moderateScale(200),
    height: moderateScale(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    fontSize: moderateScale(24),
    textShadowColor: COLORS.gradientPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  floatingSparkles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingSparkle: {
    position: 'absolute',
    fontSize: moderateScale(16),
    color: COLORS.accentOrange,
  },
});

export default StreakExtensionAnimation;