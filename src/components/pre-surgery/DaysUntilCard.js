import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const DaysUntilCard = ({ days }) => {
  return (
    <View style={styles.daysUntilCard}>
      <Text style={styles.daysText}>{days} days</Text>
      <Text style={styles.untilText}>Until your scheduled surgery date</Text>
    </View>
  );
};

export default DaysUntilCard;

const styles = StyleSheet.create({
  daysUntilCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center'
  },
  daysText: {
    fontSize: moderateScale(36),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(5)
  },
  untilText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray
  }
}); 