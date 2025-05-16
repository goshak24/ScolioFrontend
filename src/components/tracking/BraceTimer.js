import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const BraceTimer = ({ userId, onTimeSaved, expectedHours, currentHours }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerColor, setTimerColor] = useState(COLORS.white);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // Update timer color based on progress
  useEffect(() => {
    const currentTotalHours = currentHours + (elapsedSeconds / 3600);
    if (currentTotalHours >= expectedHours) {
      setTimerColor(COLORS.accentGreen);
    } else {
      setTimerColor(COLORS.red);
    }
  }, [elapsedSeconds, currentHours, expectedHours]);

  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSaveTime = async () => {
    const hours = elapsedSeconds / 3600;
    const today = new Date().toISOString().split('T')[0];

    try {
      // TODO: Firestore implementation as shown in parent component
      onTimeSaved && onTimeSaved(hours); 
    } catch (error) {
      console.error('Error saving brace time:', error);
    }

    // Reset timer after saving
    setElapsedSeconds(0);
    setIsRunning(false);
  };

  return (
    <View style={styles.timerContainer}>
      <Text style={[styles.timerDisplay, { color: timerColor }]}>
        {formatTime(elapsedSeconds)}
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: COLORS.primaryPurple }]}
          onPress={() => setIsRunning((prev) => !prev)}
        >
          <Text style={styles.btnText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: COLORS.accentGreen }]}
          onPress={handleSaveTime}
          disabled={elapsedSeconds === 0}
        >
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BraceTimer;

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(15),
    backgroundColor: COLORS.timerBackground,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
  },
  timerDisplay: {
    fontSize: moderateScale(36),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  controlBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(5),
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});