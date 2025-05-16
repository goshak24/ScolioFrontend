import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView, Text, ActivityIndicator, Platform } from 'react-native';
import React, { useContext, useEffect } from 'react';
import WorkoutInterface from '../components/tracking/WorkoutInterface';
import COLORS from '../constants/COLORS';
import { moderateScale } from 'react-native-size-matters';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext';
import HeightSpacer from '../components/reusable/HeightSpacer';
import BracePhysio from '../components/tracking/BracePhysio';
import BraceTrackerInterface from '../components/tracking/BraceTrackerInterface';
import PresurgeryInterface from '../components/tracking/PresurgeryInterface';
import PostsurgeryInterface from '../components/tracking/PostsurgeryInterface';
import Constants from 'expo-constants'

const Tracking = () => {
  const { state: { idToken } } = useContext(AuthContext);
  const { state: { user, loading }, fetchUserData } = useContext(UserContext);

  useEffect(() => {
    if (idToken && !user) {
      fetchUserData(idToken);
    }
  }, [idToken, user]);

  if (loading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gradientPink} />
      </View>
    );
  }

  const userAccType = user.acc_type || '';
  const scheduledWorkouts = user.treatmentData?.physio?.scheduledWorkouts || {};
  const braceData = user.treatmentData?.brace || {};
  const surgeryData = user.treatmentData?.surgery || {};
  const physioFrequency = user.treatmentData?.physio?.frequency || '';

  const parsedWorkouts = Object.entries(scheduledWorkouts)
    .filter(([_, workouts]) => Array.isArray(workouts) && workouts.length > 0)
    .flatMap(([day, workouts]) =>
      workouts.map(workout => ({
        ...workout,
        day,
        title: workout.title || 'Workout',
        time: workout.time || '00:00'
      }))
    );

  const dayMap = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
  };

  const weeklySchedule = Object.keys(scheduledWorkouts)
    .filter(day => scheduledWorkouts[day]?.length > 0)
    .map(day => dayMap[day] || day);

  const renderTrackingComponent = () => {
    switch (userAccType.toLowerCase()) {
      case 'post-surgery':
        return <PostsurgeryInterface 
                 physioData={{
                   exercises: parsedWorkouts,
                   weeklySchedule: weeklySchedule
                 }} 
                 surgeryData={surgeryData}
               />;
      case 'pre-surgery':
        return <PresurgeryInterface 
                 braceData={braceData}
                 surgeryData={surgeryData}
               />;
      case 'brace + physio':
        return <BracePhysio 
                 workouts={parsedWorkouts} 
                 weeklySchedule={weeklySchedule}
                 braceData={braceData}
                 wearingSchedule={braceData.wearingSchedule}
               />;
      case 'brace':
        return <BraceTrackerInterface 
                 data={braceData} 
                 wearingSchedule={braceData.wearingSchedule}
               />;
      case 'physio':
        return (
            <WorkoutInterface 
              workouts={parsedWorkouts} 
              weeklySchedule={weeklySchedule}
              frequency={physioFrequency}
            />
        );
      default:
        return <Text style={styles.errorText}>No tracking interface for this account type</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}> 
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        bounces={false}
      >
        <Text style={styles.headerText}>Tracking</Text> 
        {renderTrackingComponent()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Tracking;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBackground
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
    marginVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10), 
    marginTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10)
  },
  headerText: {
    color: COLORS.text,
    fontSize: moderateScale(22),
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: moderateScale(15),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
  },
});