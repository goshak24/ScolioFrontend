import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import ReusableButton from '../reusable/ReusableButton';
import COLORS from '../../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import HeightSpacer from '../reusable/HeightSpacer';
import { navigate } from '../navigation/navigationRef';

const AICompanionCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💬 Your AI bestie is here </Text>
      <Text style={styles.description}>
        Need advice or just want to vent? I'm all ears!
      </Text>
      <HeightSpacer height={moderateScale(5)} />
      <ReusableButton 
        btnText="Spill the tea"
        gradientColors={[COLORS.tabActiveStart, COLORS.tabActiveEnd]}
        onPress={() => navigate("AI")}
        textColor={COLORS.white}
        width="100%"
        borderWidth={0}
        borderColor="transparent"
      />
    </View>
  );
};

export default AICompanionCard;

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