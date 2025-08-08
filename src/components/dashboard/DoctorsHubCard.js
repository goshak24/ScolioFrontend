import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import ReusableButton from '../reusable/ReusableButton';
import COLORS from '../../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import HeightSpacer from '../reusable/HeightSpacer';
import { navigate } from '../navigation/navigationRef';

const DoctorsHubCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Doctors Hub</Text>
      <Text style={styles.description}>
        🩺 Need a specialist? We’ll help you find orthopedic surgeons, physios, and scoliosis pros near you.
      </Text>
      <HeightSpacer height={moderateScale(10)} />
      <ReusableButton 
        btnText="Find a doctor 🧑‍⚕️"
        onPress={() => navigate("FindDoctors")}
        gradientColors={[COLORS.tabActiveStart, COLORS.tabActiveEnd]}
        textColor={COLORS.white}
        width="100%"
        borderWidth={0}
        borderColor="transparent"
      />
    </View>
  );
};

export default DoctorsHubCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12), 
    padding: moderateScale(14),  
    marginVertical: moderateScale(10),
  },
  title: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold', 
    marginBottom: moderateScale(6)
  },
  description: {
    color: COLORS.lightGray,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },
});