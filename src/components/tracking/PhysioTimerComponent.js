import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const PhysioTimerComponent = ({ 
  totalTime, 
  onComplete,
  onTimerChange
}) => {
  const [currentTime, setCurrentTime] = useState(totalTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasBeenStarted, setHasBeenStarted] = useState(false); // Track if timer has been started

  const animatedProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // SVG circle properties
  const size = moderateScale(120);
  const strokeWidth = moderateScale(8);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  
  // Calculate progress percentage and stroke offset
  const progress = totalTime > 0 ? ((totalTime - currentTime) / totalTime) * 100 : 0; 
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    let timeout;
    if (totalTime > 0) {
        setReady(false); // reset ready
        timeout = setTimeout(() => {
        setReady(true);
        }, 25);
    } else {
        setReady(false);
    }

    return () => {
        clearTimeout(timeout);
    };
    }, [totalTime]);

  // Update currentTime when totalTime prop changes - but only if timer hasn't been started yet
  useEffect(() => {
    if (!hasBeenStarted && !isRunning) {
      setCurrentTime(totalTime);
      setIsCompleted(false);
    }
  }, [totalTime, hasBeenStarted, isRunning]);

  // Notify parent of timer state changes
  useEffect(() => {
    if (onTimerChange) {
      onTimerChange({
        currentTime,
        isRunning,
        isCompleted,
        progress
      });
    }
  }, [currentTime, isRunning, isCompleted, progress, onTimerChange]);

  // Main timer countdown effect
  useEffect(() => {
    let intervalId;
    
    if (isRunning && currentTime > 0) {
      intervalId = setInterval(() => {
        setCurrentTime(prevTime => {
          if (prevTime <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRunning, currentTime, onComplete]);

  // Animate progress circle when progress changes
  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Pulse animation when running
  useEffect(() => {
    if (isRunning) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRunning]);

  // Scale animation on completion
  useEffect(() => {
    if (isCompleted && totalTime > 0) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isCompleted, totalTime]);

  // Format time (MM:SS)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Start timer
  const handleStart = () => {
    if (currentTime > 0 && !isRunning) {
      setIsRunning(true);
      setHasBeenStarted(true); // Mark that timer has been started
      setIsCompleted(false);
    }
  };

  // Stop timer (pause - keeps current time)
  const handleStop = () => {
    setIsRunning(false);
    // Don't reset hasBeenStarted - keep the current time
  };

  // Reset timer (back to original totalTime)
  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setHasBeenStarted(false); // Reset the started flag
    setCurrentTime(totalTime); // Reset to original time
  };

  // Don't render if no total time is set
  if (totalTime <= 0 || !ready) {
    return null;
  } 

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.timerCircleContainer,
          {
            transform: [
              { scale: Animated.multiply(pulseAnim, scaleAnim) },
            ],
          },
        ]}
      >
        {/* SVG Circle Timer */}
        <Svg width={size} height={size} style={styles.svgCircle}>
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.progressIndicatorStart} />
              <Stop offset="100%" stopColor={COLORS.progressIndicatorEnd} />
            </SvgLinearGradient>
            <SvgLinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.progressIndicatorStart} stopOpacity="0.8" />
              <Stop offset="50%" stopColor={COLORS.progressIndicatorEnd} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={COLORS.progressIndicatorStart} stopOpacity="0.8" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.workoutOption}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Glow effect when running */}
          {isRunning && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#glowGradient)"
              strokeWidth={strokeWidth + 2}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              opacity={0.3}
            />
          )}
          
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Timer Text Overlay */}
        <View style={styles.timerTextContainer}>
          <Text style={styles.timerText}>{formatTime(currentTime)}</Text>
          <Text style={[
            styles.timerLabel,
            isRunning && styles.timerLabelActive,
            isCompleted && styles.timerLabelCompleted
          ]}>
            {isCompleted ? 'COMPLETED!' : isRunning ? 'IN PROGRESS' : hasBeenStarted ? 'PAUSED' : 'READY TO START'}
          </Text>
        </View>
      </Animated.View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity 
            style={[
              styles.controlButton, 
              styles.startButton,
              currentTime <= 0 && styles.disabledButton
            ]} 
            onPress={handleStart}
            disabled={currentTime <= 0}
          >
            <Text style={styles.controlButtonText}>▶ {hasBeenStarted ? 'Resume' : 'Start'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.controlButton, styles.stopButton]} 
            onPress={handleStop}
          >
            <Text style={styles.controlButtonText}>⏸ Pause</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.resetButton]} 
          onPress={handleReset}
        >
          <Text style={styles.controlButtonText}>🔄 Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.progressBackground,
    borderRadius: moderateScale(15),
    padding: moderateScale(25),
    marginBottom: moderateScale(15),
    alignItems: 'center',
  },
  timerCircleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  svgCircle: {
    transform: [{ rotate: '0deg' }],
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: COLORS.white,
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timerLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(10),
    fontWeight: '600',
    marginTop: moderateScale(4),
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  timerLabelActive: {
    color: COLORS.progressIndicatorEnd,
  },
  timerLabelCompleted: {
    color: COLORS.accentGreen,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: moderateScale(20),
  },
  controlButton: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(10),
    minWidth: moderateScale(80),
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.accentGreen,
  },
  stopButton: {
    backgroundColor: COLORS.red,
  },
  disabledButton: {
    opacity: 0.5,
  },
  resetButton: {
    backgroundColor: COLORS.primaryPurple,
  },
  controlButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
});

export default PhysioTimerComponent;