import { SafeAreaView, StyleSheet, Text, View, ScrollView, StatusBar, ActivityIndicator, Platform } from 'react-native';
import React, { useContext, useEffect } from 'react';
import { scale, moderateScale } from 'react-native-size-matters';
import CalendarHeader from '../components/dashboard/CalendarHeader';
import ProgressTracker from '../components/ProgressTracker';
import WorkoutSection from '../components/dashboard/WorkoutSection';
import HeightSpacer from '../components/reusable/HeightSpacer';
import COLORS from '../constants/COLORS';
import TrendingFeed from '../components/dashboard/TrendingFeed';
import BraceTimeCard from '../components/dashboard/BraceTimeCard';
import AICompanionCard from '../components/dashboard/AICompanionCard';
import DailyTipCard from '../components/dashboard/DailyTipCard';
import CommunityCard from '../components/dashboard/CommunityCard';
import SurgeryProgressCard from '../components/dashboard/SurgeryProgressCard';
import PainTrackerSummary from '../components/dashboard/PainTrackerSummary';
import { Context as UserContext } from '../context/UserContext';
import { Context as PainTrackingContext } from '../context/PainTrackingContext';
import Constants from 'expo-constants'
import DoctorsHubCard from '../components/dashboard/DoctorsHubCard';

const Dashboard = () => {
  const { state: { user, loading } } = useContext(UserContext);

  const { state, loadPainLogs } = useContext(PainTrackingContext); 

  // Get the most recent pain log
  const getMostRecentPainLog = () => {
    if (!state.painLogs || state.painLogs.length === 0) {
      return null;
    }
    
    // Sort by createdAt timestamp (most recent first)
    const sortedLogs = [...state.painLogs].sort((a, b) => {
      const timeA = a.createdAt._seconds * 1000 + a.createdAt._nanoseconds / 1000000;
      const timeB = b.createdAt._seconds * 1000 + b.createdAt._nanoseconds / 1000000;
      return timeB - timeA;
    }); 

    return sortedLogs[0];
  };

  useEffect(() => {
    loadPainLogs();
  }, []);

  // Show loading indicator if user data is being fetched
  if (loading || !user) {
    return (
      <View style={[styles.rootContainer, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  // Determine if this is a surgery-related account type
  const isSurgeryRelated = user.acc_type?.toLowerCase() === 'pre-surgery' || 
                           user.acc_type?.toLowerCase() === 'presurgery' ||
                           user.acc_type?.toLowerCase() === 'post-surgery' ||
                           user.acc_type?.toLowerCase() === 'postsurgery';

  // Determine if brace-related account
  const isBraceRelated = user.acc_type?.toLowerCase() === 'brace' || 
                         user.acc_type?.toLowerCase() === 'brace + physio';

  return (
    <View style={styles.rootContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple}  
        translucent={false} 
      />

      <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }}>
        <CalendarHeader profilePic={user.profilePicture} username={user.username} />

        <ScrollView
          style={{ backgroundColor: COLORS.backgroundPurple }}
          contentContainerStyle={{ flexGrow: 1 }}
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <HeightSpacer height={moderateScale(15)} />
            
            {/* Conditionally render streak display only for non-surgery account types */}
            {user.acc_type !== 'presurgery' && (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.daysText}>Streak: {user.streaks || 0} {user.streaks === 1 ? 'day' : 'days'}</Text>
                <HeightSpacer height={moderateScale(2)} />
                <Text style={styles.subtitle}>Your progress is giving main character energy ✨</Text>
                <HeightSpacer height={moderateScale(5)} />
              </View>
            )}
            
            {/* Show SurgeryProgressCard for surgery accounts */}
            {isSurgeryRelated && <SurgeryProgressCard />}
            
            {/* Only show BraceTimeCard for brace-related accounts */}
            {/*{isBraceRelated && <BraceTimeCard />} */} 
            
            {/* Only show ProgressTracker for non-surgery accounts */}
            {!isSurgeryRelated && <ProgressTracker physioStreak={user?.streaks} />}

            <CommunityCard />

            <PainTrackerSummary painLog={getMostRecentPainLog()} />

            <AICompanionCard />
            
            {/*<TrendingFeed />*/}
            
            <DoctorsHubCard />
            
            {/*<DailyTipCard />*/}
            
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPurple, 
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: COLORS.darkBackground,
    paddingBottom: moderateScale(10)
  },
  daysText: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
})

// Consistent Styling across screen content must be: paddingBottom: moderateScale(20), 
//    marginVertical: moderateScale(20),
//    paddingHorizontal: moderateScale(15). 