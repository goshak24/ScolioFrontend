import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';

/**
 * LoadingState component to display loading indicators and error states
 * @param {boolean} loading - Whether content is loading
 * @param {string} error - Error message to display (if any)
 * @param {Function} onRetry - Function to handle retry button press
 */
const LoadingState = ({ loading, error, onRetry }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gradientPink} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={moderateScale(40)} color={COLORS.gradientPink} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
    backgroundColor: COLORS.darkBackground,
  },
  errorText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginVertical: moderateScale(15),
  },
  retryButton: {
    backgroundColor: COLORS.gradientPurple,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    marginTop: moderateScale(10),
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
});

export default LoadingState;
