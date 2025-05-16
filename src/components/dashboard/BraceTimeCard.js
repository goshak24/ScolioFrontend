import { View, Text, StyleSheet } from 'react-native';
import React, { useContext } from 'react';
import ReusableButton from '../reusable/ReusableButton';
import COLORS from '../../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import HeightSpacer from '../reusable/HeightSpacer';
import { Context as UserContext } from '../../context/UserContext';
import { navigate } from '../navigation/navigationRef';

const BraceTimeCard = () => {
  const { state: { user } } = useContext(UserContext);
  
  // Determine if combined treatment or brace-only
  const isCombined = user?.acc_type?.toLowerCase() === 'brace + physio';
  
  return (
    <View style={styles.card}>
      <Text style={styles.title}>🕒 Brace Time</Text>
      <Text style={styles.description}>
        {isCombined 
          ? "Track both your brace hours and exercises for optimal progress."
          : "Your brace is your bestie! Pop it on and track your hours."}
      </Text>
      
      <HeightSpacer height={moderateScale(5)} /> 

      <View style={styles.row}>
        <ReusableButton 
          btnText="Start Timer"
          textColor={COLORS.white}
          width="48%"
          borderWidth={0}
          borderColor="transparent"
          useGradient={true} 
          gradientColors={["#B15EFF", "#EA6AB5"]} 
          onPress={() => navigate("Tracking")}
        />

        <ReusableButton 
          btnText="Log Hours"
          textColor={COLORS.white}
          width="48%"
          borderWidth={0}
          borderColor="transparent"
          useGradient={true}
          gradientColors={["#2B60EB", "#6172F6", "#756AF6"]}
          onPress={() => navigate("Tracking")}
        />
      </View>
    </View>
  );
};

export default BraceTimeCard;

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
  },
  description: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
  } 
}); 