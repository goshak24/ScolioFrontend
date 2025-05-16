import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS';

const WorkoutTimer = ({ totalTime, onComplete }) => {
    const [remainingTime, setRemainingTime] = useState(totalTime);
    const [isRunning, setIsRunning] = useState(false);

    // Format time (MM:SS)
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Start Timer
    const startTimer = () => {
        if (isRunning || remainingTime <= 0) return;
        setIsRunning(true);
    };

    // Stop Timer
    const stopTimer = () => {
        setIsRunning(false);
    };

    // Reset Timer
    const resetTimer = () => {
        setIsRunning(false);
        setRemainingTime(totalTime);
    };

    // Timer logic
    useEffect(() => {
        let interval;
        if (isRunning && remainingTime > 0) {
            interval = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsRunning(false);
                        onComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, remainingTime]);

    return (
        <View style={styles.timerContainer}>
            <Text style={styles.timerText}>⏳ {formatTime(remainingTime)}</Text>

            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={stopTimer}>
                <Text style={styles.controlButtonText}>⏹ Stop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={resetTimer}>
                <Text style={styles.controlButtonText}>🔄 Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.startButton} onPress={startTimer} disabled={remainingTime <= 0}>
                <Text style={styles.startButtonText}>{isRunning ? 'Workout in Progress' : '▶ Start Workout'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.timerBackground,
        padding: moderateScale(10),
        borderRadius: moderateScale(10),
        marginBottom: moderateScale(8),
    },
    timerText: {
        color: COLORS.text,
        fontSize: moderateScale(16),
        fontWeight: 'bold',
    },
    controlButton: {
        paddingVertical: moderateScale(8),
        paddingHorizontal: moderateScale(12),
        borderRadius: moderateScale(8),
    },
    stopButton: { backgroundColor: COLORS.red },
    resetButton: { backgroundColor: COLORS.lightGray },
    controlButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: moderateScale(14),
    },
    startButton: {
        backgroundColor: COLORS.primaryPurple,
        padding: moderateScale(12),
        borderRadius: moderateScale(10),
        alignItems: 'center',
    },
    startButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        fontSize: moderateScale(14),
    },
});

export default WorkoutTimer; 