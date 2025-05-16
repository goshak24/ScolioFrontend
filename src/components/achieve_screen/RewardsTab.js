import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import ReusableButton from '../reusable/ReusableButton';

const RewardsTab = ({ points }) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Ionicons name="flame" size={moderateScale(18)} color={COLORS.tabActiveStart} />
        <Text style={styles.headerText}>Your Points</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.streakText}>{points} Points</Text>
        </View>
      </View>

      <Text style={styles.description}>Use your points to unlock special rewards and features!</Text>

      <ReusableButton
        onPress={() => console.log("Earn More Points Pressed!")}
        btnText="Earn More Points"
        textColor="#FFFFFF"
        width="100%"
        borderWidth={0}
        borderRadius={moderateScale(8)}
      />
    </View>
  );
};

export default RewardsTab;

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  pointsBadge: {
    backgroundColor: COLORS.backgroundPurple,
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
  },
}); 