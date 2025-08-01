import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import COLORS from '../../constants/COLORS';

const BraceTimer = ({ userId, onTimeSaved, expectedHours, currentHours }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerColor, setTimerColor] = useState(COLORS.white);
  const [startTimestamp, setStartTimestamp] = useState(null);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const STORAGE_KEYS = {
    START_TIMESTAMP: 'braceTimer_startTimestamp',
    TOTAL_ELAPSED: 'braceTimer_totalElapsed', 
    IS_RUNNING: 'braceTimer_isRunning',
    SESSION_DATE: 'braceTimer_sessionDate',
    LAST_SAVE_TIME: 'braceTimer_lastSaveTime'
  };

  // Initialize timer state from AsyncStorage on mount
  useEffect(() => {
    initializeTimerFromStorage();
    
    // Listen for app state changes (as backup)
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - recalculate elapsed time
        recalculateElapsedTime();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      clearInterval(intervalRef.current);
    };
  }, []);

  // Initialize timer state from storage on app start
  const initializeTimerFromStorage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [
        storedStartTimestamp,
        storedTotalElapsed,
        storedIsRunning,
        storedSessionDate,
        storedLastSaveTime
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.START_TIMESTAMP),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_ELAPSED),
        AsyncStorage.getItem(STORAGE_KEYS.IS_RUNNING),
        AsyncStorage.getItem(STORAGE_KEYS.SESSION_DATE),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SAVE_TIME)
      ]);

      const sessionDate = storedSessionDate || today;
      
      // If it's a new day, reset everything
      if (sessionDate !== today) {
        console.log('New day detected, resetting timer');
        await clearAllTimerData();
        return;
      }

      // Restore timer state
      const wasRunning = storedIsRunning === 'true';
      const totalElapsedBefore = parseInt(storedTotalElapsed) || 0;
      const startTime = parseInt(storedStartTimestamp);
      
      if (wasRunning && startTime) {
        // Calculate current elapsed time from the original start timestamp
        const now = Date.now();
        const totalElapsedNow = Math.floor((now - startTime) / 1000);
        
        console.log('Timer was running. Start time:', new Date(startTime).toLocaleTimeString());
        console.log('Total elapsed now:', totalElapsedNow, 'seconds');
        
        setElapsedSeconds(totalElapsedNow);
        setStartTimestamp(startTime);
        setIsRunning(true);
        
        // Update stored total elapsed time
        await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ELAPSED, totalElapsedNow.toString());
      } else if (totalElapsedBefore > 0) {
        // Timer was paused, restore the paused state
        console.log('Timer was paused. Restoring elapsed time:', totalElapsedBefore);
        setElapsedSeconds(totalElapsedBefore);
        setIsRunning(false);
      }
      
    } catch (error) {
      console.error('Error initializing timer from storage:', error);
    }
  };

  // Recalculate elapsed time (for app state changes)
  const recalculateElapsedTime = async () => {
    try {
      if (!isRunning || !startTimestamp) return;
      
      const now = Date.now();
      const totalElapsed = Math.floor((now - startTimestamp) / 1000);
      
      console.log('Recalculating elapsed time:', totalElapsed);
      setElapsedSeconds(totalElapsed);
      
      // Update storage
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ELAPSED, totalElapsed.toString());
    } catch (error) {
      console.error('Error recalculating elapsed time:', error);
    }
  };

  // Timer interval effect - only for UI updates when running
  useEffect(() => {
    if (isRunning && startTimestamp) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const totalElapsed = Math.floor((now - startTimestamp) / 1000);
        setElapsedSeconds(totalElapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTimestamp]);

  // Save state to storage whenever critical state changes
  useEffect(() => {
    if (startTimestamp || elapsedSeconds > 0) {
      saveTimerState();
    }
  }, [isRunning, elapsedSeconds, startTimestamp]);

  // Save timer state to AsyncStorage
  const saveTimerState = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const saveTime = Date.now();
      
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ELAPSED, elapsedSeconds.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.IS_RUNNING, isRunning.toString()),
        AsyncStorage.setItem(STORAGE_KEYS.SESSION_DATE, today),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SAVE_TIME, saveTime.toString()),
        startTimestamp ? AsyncStorage.setItem(STORAGE_KEYS.START_TIMESTAMP, startTimestamp.toString()) : Promise.resolve()
      ]);
      
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  };

  // Clear all timer data
  const clearAllTimerData = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.START_TIMESTAMP),
        AsyncStorage.removeItem(STORAGE_KEYS.TOTAL_ELAPSED),
        AsyncStorage.removeItem(STORAGE_KEYS.IS_RUNNING),
        AsyncStorage.removeItem(STORAGE_KEYS.SESSION_DATE),
        AsyncStorage.removeItem(STORAGE_KEYS.LAST_SAVE_TIME)
      ]);
      
      setElapsedSeconds(0);
      setIsRunning(false);
      setStartTimestamp(null);
    } catch (error) {
      console.error('Error clearing timer data:', error);
    }
  };

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

  const handleStartPause = async () => {
    try {
      if (isRunning) {
        // Pausing - stop the timer but keep elapsed time
        console.log('Pausing timer at', elapsedSeconds, 'seconds');
        setIsRunning(false);
        setStartTimestamp(null);
        
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'false'),
          AsyncStorage.removeItem(STORAGE_KEYS.START_TIMESTAMP),
          AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ELAPSED, elapsedSeconds.toString())
        ]);
      } else {
        // Starting - record the start timestamp
        const now = Date.now();
        const adjustedStartTime = now - (elapsedSeconds * 1000); // Adjust for already elapsed time
        
        console.log('Starting timer. Adjusted start time:', new Date(adjustedStartTime).toLocaleTimeString());
        
        setIsRunning(true);
        setStartTimestamp(adjustedStartTime);
        
        const today = new Date().toISOString().split('T')[0];
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.START_TIMESTAMP, adjustedStartTime.toString()),
          AsyncStorage.setItem(STORAGE_KEYS.IS_RUNNING, 'true'),
          AsyncStorage.setItem(STORAGE_KEYS.SESSION_DATE, today)
        ]);
      }
    } catch (error) {
      console.error('Error handling start/pause:', error);
    }
  };

  const handleSaveTime = async () => {
    const hours = elapsedSeconds / 3600;

    try {
      console.log('Saving timer:', hours, 'hours');
      
      // Save the time through parent component
      onTimeSaved && onTimeSaved(hours); 
      
      // Clear all timer data after saving
      await clearAllTimerData();
      
    } catch (error) {
      console.error('Error saving brace time:', error);
    }
  };

  const handleReset = async () => {
    try {
      console.log('Resetting timer');
      await clearAllTimerData();
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  return (
    <View style={styles.timerContainer}>
      <Text style={[styles.timerDisplay, { color: timerColor }]}>
        {formatTime(elapsedSeconds)}
      </Text>

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={[styles.controlBtn, { backgroundColor: isRunning ? COLORS.red : COLORS.primaryPurple }]}
          onPress={handleStartPause}
        >
          <Text style={styles.btnText}>{isRunning ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlBtn, 
            { backgroundColor: COLORS.lightGray },
            elapsedSeconds === 0 && styles.disabledBtn
          ]}
          onPress={handleReset}
          disabled={elapsedSeconds === 0}
        >
          <Text style={[styles.btnText, elapsedSeconds === 0 && styles.disabledText]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlBtn, 
            { backgroundColor: COLORS.accentGreen },
            elapsedSeconds === 0 && styles.disabledBtn
          ]}
          onPress={handleSaveTime}
          disabled={elapsedSeconds === 0}
        >
          <Text style={[styles.btnText, elapsedSeconds === 0 && styles.disabledText]}>Save</Text>
        </TouchableOpacity>
      </View>

      {elapsedSeconds > 0 && (
        <View style={styles.sessionInfoContainer}>
          <Text style={styles.sessionInfo}>
            Session Time: {(elapsedSeconds / 3600).toFixed(2)} hours
          </Text>
          {isRunning && startTimestamp && (
            <Text style={styles.sessionInfo}>
              Started: {new Date(startTimestamp + (elapsedSeconds * 1000)).toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}
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
    width: '100%',
    marginBottom: moderateScale(10),
  },
  controlBtn: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    marginHorizontal: moderateScale(3),
    flex: 1,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  disabledText: {
    color: COLORS.lightGray,
  },
  sessionInfoContainer: {
    alignItems: 'center',
  },
  sessionInfo: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    textAlign: 'center',
    marginTop: moderateScale(2),
  },
});