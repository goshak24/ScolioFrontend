import { SafeAreaView, StyleSheet, Text, View, ScrollView, StatusBar, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { scale, moderateScale } from 'react-native-size-matters';
import CalendarHeader from '../components/dashboard/CalendarHeader';
import HeightSpacer from '../components/reusable/HeightSpacer';
import COLORS from '../constants/COLORS';
import SurgeryProgressCard from '../components/dashboard/SurgeryProgressCard';
import { Context as UserContext } from '../context/UserContext';
import { Context as PainTrackingContext } from '../context/PainTrackingContext';
import { Context as ActivityContext } from '../context/ActivityContext';
import Constants from 'expo-constants'
import DoctorsHubCard from '../components/dashboard/DoctorsHubCard';
import HeroCard from '../components/dashboard/HeroCard';
import QuickActions from '../components/dashboard/QuickActions';
import ProgressList from '../components/dashboard/ProgressList';
import ProgressMetricsCard from '../components/dashboard/ProgressMetricsCard';
import RecentActivity from '../components/dashboard/RecentActivity';
import { navigate } from '../components/navigation/navigationRef';
import CalendarModal from '../components/reusable/Calendar/CalendarModal';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const Dashboard = () => {
  const { state: { user, loading }, resetDailyBraceHours } = useContext(UserContext);
  const { state: painState, loadPainLogs } = useContext(PainTrackingContext);
  const { state: activityState, fetchActivityData } = useContext(ActivityContext);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [events, setEvents] = useState({});

  // Get the most recent pain log
  const getMostRecentPainLog = () => {
    if (!painState.painLogs || painState.painLogs.length === 0) {
      return null;
    }
    
    // Sort by createdAt timestamp (most recent first)
    const sortedLogs = [...painState.painLogs].sort((a, b) => {
      const timeA = a.createdAt._seconds * 1000 + a.createdAt._nanoseconds / 1000000;
      const timeB = b.createdAt._seconds * 1000 + b.createdAt._nanoseconds / 1000000;
      return timeB - timeA;
    }); 

    return sortedLogs[0];
  };

  // Calendar events handlers (same behavior as header modal)
  const handleEventAdd = (date, eventData) => {
    if (!date || !eventData) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    setEvents(prev => {
      const dateEvents = prev[dateStr] || [];
      return { ...prev, [dateStr]: [...dateEvents, eventData] };
    });
  };
  const handleEventDelete = (date, eventIndex) => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    setEvents(prev => {
      const dateEvents = [...(prev[dateStr] || [])];
      dateEvents.splice(eventIndex, 1);
      const next = { ...prev };
      if (dateEvents.length === 0) delete next[dateStr]; else next[dateStr] = dateEvents;
      return next;
    });
  };

  // Hooks must run consistently on every render — declare derived hooks before any early return
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = useMemo(() => dayNames[new Date().getDay()], []);
  const painTrend = useMemo(() => {
    const logs = painState?.painLogs || [];
    if (!Array.isArray(logs) || logs.length === 0) return 'No data';
    const now = new Date();
    const toKey = (d) => new Date(d).toISOString().split('T')[0];
    const daysBack = (n) => new Date(now.getTime() - n * 86400000);
    const last7 = new Set(Array.from({length:7}, (_,i) => toKey(daysBack(i))));
    const prev7 = new Set(Array.from({length:7}, (_,i) => toKey(daysBack(i+7))));
    const avg = (arr) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const lastVals = logs.filter(l => last7.has(l.date)).map(l => Number(l.painIntensity || l.pain || 0));
    const prevVals = logs.filter(l => prev7.has(l.date)).map(l => Number(l.painIntensity || l.pain || 0));
    const a1 = avg(lastVals), a0 = avg(prevVals);
    if (!isFinite(a1) || !isFinite(a0)) return 'No data';
    if (a1 < a0) return 'Trending down';
    if (a1 > a0) return 'Trending up';
    return 'Flat';
  }, [painState?.painLogs]);

  useEffect(() => {
    loadPainLogs();
  }, []);

  // Refresh lightweight data whenever Dashboard gains focus (no global loading flip)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          loadPainLogs && loadPainLogs();
          if (!cancelled && resetDailyBraceHours) await resetDailyBraceHours();
          if (!cancelled && fetchActivityData) await fetchActivityData();
        } catch {}
      })();
      return () => { cancelled = true; };
    }, [])
  );

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

  const braceHoursToday = (activityState?.braceData?.[todayKey]) 
    ?? user?.treatmentData?.brace?.wearingHistory?.[todayKey] 
    ?? 0;
  const physioCompletedToday = user?.treatmentData?.physio?.physioHistory?.[todayKey] || 0;
  const scheduledForToday = (user?.treatmentData?.physio?.scheduledWorkouts?.[todayDayName] || []).length;
  const username = user?.username || 'there';

  const mostRecentPain = getMostRecentPainLog();
  const accType = (user.acc_type || '').toLowerCase();
  const isBrace = accType === 'brace';
  const isPhysio = accType === 'physio';
  const isBracePhysio = accType === 'brace + physio' || accType === 'brace+physio';
  const isPreSurgery = accType === 'pre-surgery' || accType === 'presurgery';
  const isPostSurgery = accType === 'post-surgery' || accType === 'postsurgery';

  // Build playful, relevant quick actions by account type
  const baseActions = [
    { id: 'streak', title: 'Daily Streak', subtitle: `${user?.streaks || 0} days strong`, icon: 'flame', bg: '#FB923C20', action: 'Flex it 🔥' },
    { id: 'pain', title: 'Pain Check-in', subtitle: mostRecentPain ? `Last: ${mostRecentPain.painIntensity}/10` : 'How are we feeling today?', icon: 'heart', bg: '#A855F720', action: 'Log it 💬' },
    { id: 'calendar', title: 'Calendar', subtitle: 'Plan your week like a pro', icon: 'calendar', bg: '#8B5CF620', action: 'Open 📅' },
    { id: 'community', title: 'Community', subtitle: 'Your squad awaits', icon: 'people', bg: '#22C55E20', action: 'Say hi 👋' },
    { id: 'ai', title: 'AI Bestie', subtitle: 'Ask me anything', icon: 'chatbubbles', bg: '#06B6D420', action: 'Spill the tea ☕' },
    { id: 'doctors', title: 'Doctors Hub', subtitle: 'Find specialists', icon: 'medkit', bg: '#F59E0B20', action: 'Find 🩺' },
  ];

  const braceAction = { id: 'brace', title: 'Brace Timer', subtitle: `${braceHoursToday} / ${user?.treatmentData?.brace?.wearingSchedule || 16} hours today`, icon: 'time', bg: '#3B82F620', action: 'Start timer ▶' };
  const physioAction = { id: 'physio', title: 'Exercise Routine', subtitle: `${physioCompletedToday} of ${scheduledForToday} done`, icon: 'barbell', bg: '#10B98120', action: "Let's move 💪" };
  const preSurgeryAction = { id: 'presurgery', title: 'Pre-Op Checklist', subtitle: 'Prep like a pro', icon: 'clipboard', bg: '#3B82F620', action: 'Open ✅' };
  const postSurgeryAction = { id: 'postsurgery', title: 'Recovery Tasks', subtitle: 'Gentle wins today', icon: 'pulse', bg: '#10B98120', action: 'Start 🌱' };

  let quickActions = [...baseActions];
  if (isBrace) quickActions = [braceAction, ...baseActions];
  if (isPhysio) quickActions = [physioAction, ...baseActions];
  if (isBracePhysio) quickActions = [braceAction, physioAction, ...baseActions];
  if (isPreSurgery) quickActions = [preSurgeryAction, ...baseActions.filter(a => a.id !== 'streak')];
  if (isPostSurgery) quickActions = [postSurgeryAction, ...baseActions.filter(a => a.id !== 'streak')];

  const progressCards = [
    { key: 'streakMix', title: 'Daily Streak Mix', subtitle: `${user?.streaks || 0} days • Your longest streak`, icon: 'flame', bg: '#FB923C20' },
    { key: 'painInsights', title: 'Pain Insights', subtitle: `Weekly summary • ${painTrend}`, icon: 'trending-up', bg: '#A855F720' },
    { key: 'goals', title: 'Treatment Goals', subtitle: 'Keep going • You got this', icon: 'trophy', bg: '#10B98120' },
  ];

  return (
    <View style={styles.rootContainer}>
      <StatusBar 
        barStyle="light-content"  
        translucent={false} 
      />

      <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }}>
        <CalendarHeader 
          profilePic={user.profilePicture} 
          username={user.username}
          onOpenCalendar={() => setShowCalendarModal(true)}
        />

        <ScrollView
          style={{ backgroundColor: COLORS.darkBackground }}
          contentContainerStyle={{ flexGrow: 1 }}
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <HeightSpacer height={moderateScale(12)} />

            {/* Hero Card */}
            <HeroCard username={username} isPlaying={isPlaying} onToggle={() => setIsPlaying(!isPlaying)} />

            <HeightSpacer height={moderateScale(12)} />

            {/* Quick Actions */}
            <QuickActions 
              actions={quickActions}
              onActionPress={(id) => {
                switch (id) {
                  case 'streak':
                    navigate('Achieve');
                    break;
                  case 'pain':
                    navigate('PainTracker');
                    break;
                  case 'brace':
                  case 'physio':
                    navigate('Tracking');
                    break;
                  case 'presurgery':
                    navigate('Tracking'); // PresurgeryInterface inside Tracking
                    break;
                  case 'postsurgery':
                    navigate('Tracking'); // PostsurgeryInterface inside Tracking
                    break;
                  case 'calendar':
                    setShowCalendarModal(true);
                    break;
                  case 'community':
                    navigate('Squad');
                    break;
                  case 'ai':
                    navigate('AI');
                    break;
                  case 'doctors':
                    navigate('FindDoctors');
                    break;
                  default:
                    break;
                }
              }}
            />

            {/* Progress metrics card (account-aware) */}
            <ProgressMetricsCard user={user} painLogs={painState?.painLogs || []} />

            {/* Surgery progress for surgery accounts: DELETED FOR NOW BECAUSE OF NEW DASHBOARD */}


            

            {/* Recent activity */}
            <RecentActivity items={(function(){
              const items = [];
              if (physioCompletedToday > 0) items.push({ name: 'Physio Session', time: 'Today', icon: 'barbell' });
              if (braceHoursToday > 0) items.push({ name: 'Brace Check', time: 'Today', icon: 'time' });
              if (mostRecentPain) items.push({ name: 'Pain Log', time: 'Recent', icon: 'heart' });
              return items;
            })()} />

            {/* Doctors Hub */}
            <View style={styles.cardBlock}>
              <DoctorsHubCard />
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
      {/* Global Calendar Modal (reusing same component as header) */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onDateSelect={(date) => {}}
        events={events}
        initialDate={new Date()}
        onEventAdd={handleEventAdd}
        onEventDelete={handleEventDelete}
        defaultView="month"
      />
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBackground, 
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: COLORS.darkBackground,
    paddingBottom: moderateScale(10),
    paddingHorizontal: moderateScale(12)
  },
  sectionHeader: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8)
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickCard: {
    width: '48%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(10)
  },
  quickIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8)
  },
  quickTitle: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(13)
  },
  quickSubtitle: {
    color: COLORS.text,
    fontSize: moderateScale(11),
    marginBottom: moderateScale(8)
  },
  quickButton: {
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    alignItems: 'center'
  },
  quickButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '600'
  },
  cardBlock: {
    marginTop: moderateScale(14)
  },
  streakCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12)
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  streakTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16)
  },
  streakSubtitle: {
    color: COLORS.text,
    fontSize: moderateScale(12)
  },
  progressCard: {
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    marginBottom: moderateScale(8)
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  progressTitle: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14)
  },
  progressSubtitle: {
    color: COLORS.text,
    fontSize: moderateScale(12)
  },
  activityCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12)
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(6)
  },
  activityIconWrap: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(10)
  },
  activityName: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    fontWeight: '500'
  },
  activityTime: {
    color: COLORS.text,
    fontSize: moderateScale(11)
  }
})


// Consistent Styling across screen content must be: paddingBottom: moderateScale(20), 
//    marginVertical: moderateScale(20),
//    paddingHorizontal: moderateScale(15). 