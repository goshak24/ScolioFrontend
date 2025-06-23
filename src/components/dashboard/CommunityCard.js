import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import ReusableButton from '../reusable/ReusableButton';
import COLORS from '../../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters'; 
import HeightSpacer from '../reusable/HeightSpacer';
import { navigate } from '../navigation/navigationRef';

const CommunityCard = () => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>💚 Community Vibes</Text>
      <Text style={styles.description}>
        Connect with others and share your journey.
        Featuring New Groups Feature! 
      </Text>
      <HeightSpacer height={moderateScale(5)} />
      <ReusableButton 
        btnText="Send Good Vibes"
        textColor={COLORS.lightGray}
        onPress={() => navigate("Squad")} 
        backgroundColor={"#fff"}
        useGradient={false}
        width="100%"
        borderWidth={0}
        borderColor="transparent"
    />
    </View>
  );
};

export default CommunityCard; 

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
