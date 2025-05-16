import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React from 'react';
import COLORS from '../constants/COLORS'; // Import your color palette

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.gradientPurple} />
    </View>
  );
};

export default LoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
}); 