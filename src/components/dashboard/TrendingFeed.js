import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const TrendingFeed = () => {
  return (
    // Can Fix gradients later 
    <LinearGradient  
      colors={["#C284FA", "#D17EE5", "#E378CD", "#F273B8"]} 
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.title}>Trending Now</Text>
      <Text style={styles.trendingText}>3 poses for that perfect TikTok posture</Text>
    </LinearGradient>
  );
};

export default TrendingFeed; 

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(10), 
    marginVertical: moderateScale(7.5),  
    height: verticalScale(140)
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white, 
    marginBottom: moderateScale(5)
  },
  trendingText: {
    fontSize: moderateScale(14),
    color: COLORS.white, 
    fontWeight: '600',
  },
}); 