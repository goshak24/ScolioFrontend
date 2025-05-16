import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import COLORS from '../../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import HeightSpacer from '../reusable/HeightSpacer';

const DailyTipCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>☕ Daily Tea</Text>
      <HeightSpacer height={2} /> 
      <Text style={styles.description}>
        Stretching for 5 mins before putting on your brace is giving comfort queen vibes! Try it today.
      </Text>
    </View>
  );
};

export default DailyTipCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10), 
    padding: moderateScale(16), 
    marginHorizontal: moderateScale(10), 
    marginVertical: moderateScale(7.5),  
  },
  title: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold', 
    marginBottom: moderateScale(5)
  },
  description: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    marginVertical: 4,
  },
});
