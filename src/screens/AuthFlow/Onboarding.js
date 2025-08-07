import { StatusBar, StyleSheet, Text, View, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import React, { useContext, useEffect, useState, useRef } from 'react';
import { useFonts } from 'expo-font';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import ReusableButton from '../../components/reusable/ReusableButton';
import { navigate } from '../../components/navigation/navigationRef';
import HeightSpacer from '../../components/reusable/HeightSpacer';
import { Context as AuthContext } from '../../context/AuthContext';
import { Context as UserContext } from '../../context/UserContext';
import { Context as NotificationContext } from '../../context/NotificationContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// Onboarding slides data
const onboardingData = [
  {
    id: 1,
    title: "Track Your Journey",
    description: "Monitor your scoliosis treatment progress with comprehensive tracking tools for pain, brace wearing, and physiotherapy sessions.",
    icon: "pulse",
    gradient: [COLORS.gradientPurple, COLORS.gradientPink],
  },
  {
    id: 2,
    title: "AI-Powered Support",
    description: "Get personalized guidance and answers to your questions with our intelligent AI assistant, available 24/7.",
    icon: "chatbubble-ellipses",
    gradient: ['#3B82F6', '#8B5CF6'],
  },
  {
    id: 3,
    title: "Connect & Share",
    description: "Join a supportive community of people on similar journeys. Share experiences, ask questions, and motivate each other.",
    icon: "people",
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 4,
    title: "Achieve Your Goals",
    description: "Set milestones, earn badges, and celebrate your progress as you work towards better spinal health.",
    icon: "trophy",
    gradient: ['#F59E0B', '#D97706'],
  },
];

const Onboarding = () => {
  const { tryLocalSignIn, state: { loading: authLoading, idToken } } = useContext(AuthContext);
  const { fetchUserData, state: { loading: userLoading, user } } = useContext(UserContext);
  const { registerForNotifications, checkToken } = useContext(NotificationContext);

  const [fontsLoaded] = useFonts({
    'LeagueSpartan-Regular': require('../../../assets/fonts/LeagueSpartan-Regular.ttf'),
    'LeagueSpartan-Bold': require('../../../assets/fonts/LeagueSpartan-Bold.ttf'),
  });

  // Track auth check completion
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  
  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef(null); 

  // Scroll to current slide
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentSlide * screenWidth,
        animated: true,
      });
    }
  }, [currentSlide]);

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (slideIndex !== currentSlide) {
      setCurrentSlide(slideIndex);
    }
  };

  const handleScrollEnd = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentSlide(slideIndex);
  }; 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const success = await tryLocalSignIn();
        if (success) {
          await fetchUserData(idToken);
          const checkTokenResult = await checkToken();
          if (!checkTokenResult) {
              await registerForNotifications();
          } else {
              console.log('Push notification token already registered');
          }
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

  const renderSlide = (item, index) => (
    <View key={item.id} style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        style={styles.iconContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={item.icon} size={moderateScale(60)} color={COLORS.white} />
      </LinearGradient>
      
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {onboardingData.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            currentSlide === index && styles.activeDot
          ]}
          onPress={() => setCurrentSlide(index)}
        />
      ))}
    </View>
  );

  return (
    <LinearGradient
      colors={[COLORS.darkBackground, '#1a1a2e', COLORS.darkBackground]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>ReALIGN</Text>
        <Text style={styles.tagline}>Your Scoliosis Journey Companion</Text>
      </View>

      {/* Carousel */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          bounces={false}
          bouncesZoom={false}
          alwaysBounceHorizontal={false}
          decelerationRate="fast"
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        >
          {onboardingData.map((item, index) => renderSlide(item, index))}
        </ScrollView>
        
        {renderDots()}
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <ReusableButton 
          btnText="Get Started"
          onPress={() => navigate("SignUp1")} 
          textColor={COLORS.white}
          useGradient={true}
          gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
        />

        <HeightSpacer height={moderateScale(15)} /> 

        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => navigate("SignIn")}
        >
          <Text style={styles.signInText}>Already have an account? </Text>
          <Text style={styles.signInLink}>Sign In</Text>
        </TouchableOpacity>

        <HeightSpacer height={moderateScale(20)} />
      </View>
    </LinearGradient>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    alignItems: 'center',
    paddingTop: moderateScale(60),
    paddingBottom: moderateScale(30),
  },
  appTitle: {
    color: COLORS.white,
    fontSize: moderateScale(36),
    fontFamily: 'LeagueSpartan-Bold',
    letterSpacing: moderateScale(2),
  },
  tagline: {
    color: COLORS.lightGray,
    fontSize: moderateScale(16),
    fontFamily: 'LeagueSpartan-Regular',
    marginTop: moderateScale(8),
    textAlign: 'center',
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    alignItems: 'center',
  },
  slide: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(40),
  },
  iconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(30),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitle: {
    color: COLORS.white,
    fontSize: moderateScale(28),
    fontFamily: 'LeagueSpartan-Bold',
    textAlign: 'center',
    marginBottom: moderateScale(15),
  },
  slideDescription: {
    color: COLORS.lightGray,
    fontSize: moderateScale(16),
    fontFamily: 'LeagueSpartan-Regular',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    paddingHorizontal: moderateScale(20),
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(20),
  },
  dot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: moderateScale(4),
  },
  activeDot: {
    backgroundColor: COLORS.gradientPink,
    width: moderateScale(20),
    borderRadius: moderateScale(10),
  },
  bottomSection: {
    paddingHorizontal: moderateScale(30),
    paddingBottom: moderateScale(20),
  },
  signInButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    fontFamily: 'LeagueSpartan-Regular',
  },
  signInLink: {
    color: COLORS.gradientPink,
    fontSize: moderateScale(14),
    fontFamily: 'LeagueSpartan-Bold',
  },
});