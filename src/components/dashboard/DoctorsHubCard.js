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
      <Text style={styles.title}>🩺 Find trusted specialists nearby</Text>
      <Text style={styles.description}>
        Connect with orthopedic surgeons, physiotherapists, and scoliosis specialists in your area
      </Text>
      <HeightSpacer height={moderateScale(5)} />
      <ReusableButton 
        btnText="Find doctors"
        onPress={() => navigate("FindDoctors")}
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