import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS'; 
import HeightSpacer from '../reusable/HeightSpacer'; 
import ReusableButton from '../reusable/ReusableButton';
import { navigate } from '../../components/navigation/navigationRef'; 
import { Context as UserContext } from '../../context/UserContext';
import { Ionicons } from '@expo/vector-icons';

const WorkoutSection = () => { 
  const { state: { user } } = useContext(UserContext);
  const accType = user?.acc_type?.toLowerCase() || 'physio'; // Default to physio if not set

  // Content based on account type
  const contentMap = {
    'brace': {
      title: "Today's Brace Wear",
      description: "Ready to track your brace time? 🕒",
      buttonText: "Log Brace Time",
      icon: "time-outline",
      buttonGradient: ["#B15EFF", "#EA6AB5"]
    },
    'physio': {
      title: "Today's Physio",
      description: "Ready to slay your exercises? 🔥",
      buttonText: "Start Your Workout",
      icon: "fitness-outline",
      buttonGradient: ["#2B60EB", "#6172F6", "#756AF6"]
    },
    'brace + physio': {
      title: "Today's Treatment",
      description: "Time for your combined treatment plan! 💪",
      buttonText: "Start Treatment Plan",
      icon: "medkit-outline",
      buttonGradient: ["#B15EFF", "#EA6AB5"]
    },
    'presurgery': {
      title: "Pre-Surgery Preparation",
      description: "Complete your pre-op checklist for a successful surgery 🏥",
      buttonText: "View Pre-Op Checklist",
      icon: "clipboard-outline",
      buttonGradient: ["#3E9278", "#56C596"]
    },
    'pre-surgery': {
      title: "Pre-Surgery Preparation",
      description: "Complete your pre-op checklist for a successful surgery 🏥",
      buttonText: "View Pre-Op Checklist",
      icon: "clipboard-outline",
      buttonGradient: ["#3E9278", "#56C596"]
    },
    'postsurgery': {
      title: "Recovery Progress",
      description: "Track your healing journey with gentle activities 🌱",
      buttonText: "View Recovery Plan",
      icon: "pulse-outline",
      buttonGradient: ["#3E9278", "#56C596"]
    },
    'post-surgery': {
      title: "Recovery Progress",
      description: "Track your healing journey with gentle activities 🌱",
      buttonText: "View Recovery Plan",
      icon: "pulse-outline",
      buttonGradient: ["#3E9278", "#56C596"]
    }
  };

  // Fix accType to handle formatting variations
  const normalizedAccType = accType.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Get content for the current account type or use default
  const content = contentMap[normalizedAccType] || contentMap['physio'];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{content.title}</Text>
        <Ionicons name={content.icon} size={moderateScale(20)} color={COLORS.white} />
      </View>
      <Text style={styles.description}>{content.description}</Text>

      <HeightSpacer height={moderateScale(10)} /> 
      
      <ReusableButton 
        onPress={() => navigate("Tracking")}
        btnText={content.buttonText}
        textColor="#FFFFFF" 
        width="100%" 
        borderWidth={0} 
        borderRadius={moderateScale(8)} 
        borderColor="transparent"
        useGradient={true}
        gradientColors={content.buttonGradient}
      />
    </View>
  );
};

export default WorkoutSection;

const styles = StyleSheet.create({
  container: {
    padding: moderateScale(16),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(10), 
    marginVertical: moderateScale(7.5)
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(5)
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  description: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginBottom: moderateScale(5)
  },
  button: {
    marginTop: moderateScale(10),
    backgroundColor: COLORS.pinkButtons,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
