import { SafeAreaView, FlatList, StyleSheet, View, ActivityIndicator, Text, Platform } from 'react-native';
import React, { useState, useContext, useEffect } from 'react';
import AchieveHeader from '../components/achieve_screen/AchieveHeader';
import AchieveTabs from '../components/achieve_screen/AchieveTabs';
import AchieveContent from '../components/achieve_screen/AchieveContent';
import COLORS from '../constants/COLORS';
import HeightSpacer from '../components/reusable/HeightSpacer';
import { moderateScale } from 'react-native-size-matters';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext'; 
import Constants from 'expo-constants'; 

const Achieve = () => { 
  const { state: { idToken } } = useContext(AuthContext);
  const { state: { user, loading, error, badges }, fetchUserData, getUserBadges } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState("badges");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user data when component mounts or idToken changes
  useEffect(() => {
    if (idToken && !user) {
      fetchUserData(idToken);
    }
  }, [idToken, user]); 

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserData(idToken);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (idToken) {
      getUserBadges(idToken);
    }
  }, [idToken]); 

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gradientPink} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && (
        <View style={styles.topLoader}>
          <ActivityIndicator size="small" color={COLORS.gradientPink} />
        </View>
      )}
      
      <HeightSpacer height={Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10)} /> 
      <FlatList
        data={[]} // Avoid Virtualised List Error 
        keyExtractor={() => "key"} // Avoid Virtualised List Error 
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <>
            <View style={styles.headerContainer}>
              <AchieveHeader 
                level={user?.level || 1} 
                streakDays={user?.streaks || 0} 
              />
              <AchieveTabs setActiveTab={setActiveTab} /> 
            </View>
            <AchieveContent 
              activeTab={activeTab} 
              streakDays={user?.streaks || 0} 
              physioSessions={user?.physioSessions || 0} 
              achievements={badges || {}} 
              user={user}
            />
          </>
        }
        overScrollMode="never"
        bounces={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          refreshing ? (
            <View style={styles.refreshLoader}>
              <ActivityIndicator size="small" color={COLORS.gradientPink} />
            </View>
          ) : null
        }
      />
    </SafeAreaView> 
  );
};

export default Achieve;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground 
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.darkBackground,
    padding: moderateScale(20),
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  topLoader: {
    position: 'absolute',
    top: moderateScale(10),
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center', 
  },
  refreshLoader: {
    paddingVertical: moderateScale(20),
  },
  headerContainer: {
  },
});