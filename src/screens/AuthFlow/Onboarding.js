import { StatusBar, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import ReusableButton from '../../components/reusable/ReusableButton';
import { navigate } from '../../components/navigation/navigationRef';
import HeightSpacer from '../../components/reusable/HeightSpacer';
import { Context as AuthContext } from '../../context/AuthContext';
import { Context as UserContext } from '../../context/UserContext';

const Onboarding = () => {
  const { tryLocalSignIn, state: { loading: authLoading, idToken } } = useContext(AuthContext);
  const { fetchUserData, state: { loading: userLoading, user } } = useContext(UserContext);
  const [fontsLoaded] = useFonts({
    'LeagueSpartan-Regular': require('../../../assets/fonts/LeagueSpartan-Regular.ttf'),
    'LeagueSpartan-Bold': require('../../../assets/fonts/LeagueSpartan-Bold.ttf'),
  });

  // Track auth check completion
  const [authCheckComplete, setAuthCheckComplete] = useState(false); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const success = await tryLocalSignIn();
        if (success) {
          await fetchUserData(idToken);
          navigate("Main");
        } else {
          navigate("Auth");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        navigate("Auth");
      } finally {
        setAuthCheckComplete(true);
      }
    };

    if (!authCheckComplete && fontsLoaded) {
      checkAuth();
    }
  }, [fontsLoaded, authCheckComplete, idToken]);

  // Show loading screen until fonts are loaded and auth check is complete
  if (!fontsLoaded || !authCheckComplete || authLoading || userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gradientPink} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Text style={styles.title}>Welcome to ReALIGN</Text>

      <ReusableButton 
        btnText="Register"
        onPress={() => navigate("SignUp1")} 
        textColor={COLORS.white}
        useGradient={true}
        gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
      />

      <HeightSpacer height={moderateScale(10)} /> 

      <ReusableButton 
        btnText="Sign In"
        onPress={() => navigate("SignIn")} 
        textColor={COLORS.lightGray}
        backgroundColor={COLORS.cardDark}
        useGradient={false}
      />
    </View>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  title: {
    color: COLORS.text,
    fontSize: moderateScale(22),
    fontFamily: 'LeagueSpartan-Bold', 
    marginBottom: moderateScale(15),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
  },
});