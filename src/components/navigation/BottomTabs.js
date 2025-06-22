import React from 'react';
import { View, StyleSheet } from 'react-native'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { verticalScale, moderateScale } from 'react-native-size-matters';
import { createStackNavigator } from '@react-navigation/stack';

import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';

// Screens
import Dashboard from '../../screens/Dashboard'; 
import AI from '../../screens/AI';
import Squad from '../../screens/Squad'; 
import Tracking from '../../screens/Tracking'; 
import Achieve from '../../screens/Achieve'; 
import ProfileScreen from '../../screens/ProfileScreen'; 
import FriendsScreen from '../../screens/FriendsScreen';
import ChatScreen from '../../screens/ChatScreen';
import GroupChatScreen from '../../screens/GroupChatScreen';

import FindDoctorsScreen from '../../screens/FindDoctorsScreen';

import PainTracker from '../../screens/PainTracker';

import ForumPostScreen from '../squad/ForumPostScreen';

import PrivacyPolicyScreen from '../profile/PrivacyPolicyScreen'; 


const Tab = createBottomTabNavigator(); 
const SquadStack = createStackNavigator();
const DashboardStack = createStackNavigator(); 
const ProfileSettingsStack = createStackNavigator(); 

// Contains Dashboard and Profile Page so that navigator can access them (+ use back button from profile page to go back to dashboard) 

const ProfileAndSettingsScreens = () => {
  return (
    <ProfileSettingsStack.Navigator initialRouteName="ProfileMain" screenOptions={{ headerShown: false }}>
      <ProfileSettingsStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileSettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </ProfileSettingsStack.Navigator>
  );
} 

const DashboardStackScreens = () => {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardMain" component={Dashboard} />
      <DashboardStack.Screen name="Profile" component={ProfileAndSettingsScreens} />
      <DashboardStack.Screen name="PainTracker" component={PainTracker} />
      <DashboardStack.Screen name="FindDoctors" component={FindDoctorsScreen} />
    </DashboardStack.Navigator>
  );
};

const SquadStackScreens = () => {
  return (
    <SquadStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadStack.Screen name="SquadScreen" component={Squad} />
      <SquadStack.Screen name="ForumPostScreen" component={ForumPostScreen} />
      <SquadStack.Screen name="FriendsScreen" component={FriendsScreen} />
      <SquadStack.Screen name="ChatScreen" component={ChatScreen} />
      <SquadStack.Screen name="GroupChatScreen" component={GroupChatScreen} />
    </SquadStack.Navigator> 
  );
};

const BottomTabs = () => { 
  return (
    <Tab.Navigator 
      initialRouteName='Dashboard'
      screenOptions={({ route }) => ({ 
        tabBarIcon: ({ focused }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'calendar-outline'; 
              break;
            case 'AI':
              iconName = 'chatbox-outline';
              break;
            case 'Squad':
              iconName = 'people';
              break;
            case 'Tracking':
              iconName = 'stats-chart-outline';
              break;
            case 'Achieve': 
              iconName = 'trophy-outline';
              break;
          }

          return (
            <View style={[styles.iconContainer, !focused && styles.inactiveIconContainer]}>
              {focused ? (
                <LinearGradient 
                  colors={['#9b34ef', '#e9338a']}  
                  style={styles.activeIconContainer}
                >
                  <Ionicons name={iconName} size={moderateScale(26)} color="white" />
                </LinearGradient>
              ) : (
                <Ionicons name={iconName} size={moderateScale(26)} color={COLORS.tabInactive} />
              )}
            </View>
          );
        }, 
        tabBarHideOnKeyboard: true, 
        tabBarStyle: styles.tabBarStyle, 
        tabBarItemStyle: styles.tabBarItemStyle, 
        tabBarIconStyle: styles.tabBarIconStyle,
        headerShown: false,
        tabBarShowLabel: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStackScreens} />
      <Tab.Screen name="Squad" component={SquadStackScreens} />
      <Tab.Screen name="AI" component={AI} />
      <Tab.Screen name="Tracking" component={Tracking} />
      <Tab.Screen name="Achieve" component={Achieve} /> 
    </Tab.Navigator>
  )
}

export default BottomTabs 

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    height: verticalScale(65), 
    borderTopWidth: 0,
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  tabBarItemStyle: {
    flex: 1,
    height: verticalScale(55), 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  tabBarIconStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: moderateScale(45),  
    height: moderateScale(45), 
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    width: moderateScale(45),  
    height: moderateScale(45), 
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIconContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  } 
});