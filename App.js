import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React, { useContext, useEffect, useRef } from 'react';
import { Platform, StatusBar, View, StyleSheet } from 'react-native';

import { navigationRef } from "./src/components/navigation/navigationRef";
import COLORS from "./src/constants/COLORS";

import { Provider as AuthProvider } from "./src/context/AuthContext";
import { Provider as UserProvider } from './src/context/UserContext'; 
import { Provider as ActivityProvider } from './src/context/ActivityContext';  
import { Provider as PostSurgeryProvider } from './src/context/PostSurgeryContext';
import { Provider as PreSurgeryProvider } from './src/context/PreSurgeryContext';
import { Provider as FriendsProvider } from './src/context/FriendsContext';
import { Provider as MessagesProvider } from './src/context/MessagesContext';
import { Context as UserContext } from './src/context/UserContext';
import { Context as ActivityContext } from './src/context/ActivityContext';
import { Provider as ForumProvider } from "./src/context/ForumContext"; 
import { configureServerCaching } from './src/utilities/backendApi';
import { Provider as PainTrackingProvider } from './src/context/PainTrackingContext';
import { Provider as AssistantProvider } from './src/context/AssistantContext';
import { Provider as NotificationProvider } from './src/context/NotificationContext';

const RootStack = createStackNavigator(); 
const AuthStack = createStackNavigator(); 

import BottomTabs from "./src/components/navigation/BottomTabs";
import Onboarding from "./src/screens/AuthFlow/Onboarding";
import SignIn from "./src/screens/AuthFlow/SignIn/SignIn";
import SignUp1 from "./src/screens/AuthFlow/SignUp/SignUp1"; 
import LoadingScreen from "./src/screens/LoadingScreen";
import SignUp2 from "./src/screens/AuthFlow/SignUp/SignUp2";

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from "./src/utilities/notifications";

const AuthStackScreens = () => {
  return (
    <AuthStack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={Onboarding} />
      <AuthStack.Screen name="SignIn" component={SignIn} />
      <AuthStack.Screen name="SignUp1" component={SignUp1} />
      <AuthStack.Screen name="SignUp2" component={SignUp2} />
    </AuthStack.Navigator>
  );
};

// Create a connector component to link the contexts
const ContextConnector = ({ children }) => {
  const { setStreak, resetDailyBraceHours: resetUserBraceHours } = useContext(UserContext);
  const { setUserContextFunctions, resetDailyBraceHours: resetActivityBraceHours } = useContext(ActivityContext);
  
  // Connect the contexts when the component mounts
  useEffect(() => {
    // Pass the setStreak function to ActivityContext
    if (setUserContextFunctions && setStreak) {
      setUserContextFunctions(setStreak);
    }
    
    // Initialize brace tracking by resetting hours if it's a new day
    resetUserBraceHours();
    resetActivityBraceHours();
  }, [setUserContextFunctions, setStreak]);
  
  return <>{children}</>;
};

const App = () => {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register device for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) console.log('✅ Push token registered:'); 
    });

    // Foreground notification
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      //console.log('🔔 Notification received in foreground:', notification);
    });

    // Tap interaction
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      //console.log('📲 Notification tapped by user:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Initialize server-side caching on app startup
  useEffect(() => {
    // Wrap in a function so we can retry
    const setupCaching = async () => {
      try {
        // Try to configure server caching but continue even if it fails
        await configureServerCaching();
        console.log("Server cache configuration successful");
      } catch (err) {
        // Just log the error but don't show warnings to users
        console.log("Note: Server caching configuration unavailable - continuing without it");
        // The app will still function with default cache settings
      }
    };
    
    // Call the setup function
    setupCaching();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple} 
        translucent={false} 
      />
      <SafeAreaProvider>
        <View style={styles.container}>
          <NavigationContainer 
            ref={navigationRef}
            theme={{
              dark: true,
              colors: {
                primary: COLORS.backgroundPurple,
                background: COLORS.darkBackground,
                card: COLORS.darkBackground,
                text: COLORS.white,
                border: 'transparent',
                notification: COLORS.backgroundPurple,
              }
            }}
          >
            <RootStack.Navigator 
              initialRouteName="Auth" 
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: COLORS.darkBackground },
                cardOverlayEnabled: true,
                cardStyleInterpolator: ({ current: { progress } }) => ({
                  cardStyle: {
                    opacity: progress.interpolate({
                      inputRange: [0, 0.5, 0.9, 1],
                      outputRange: [0, 0.25, 0.7, 1],
                    }),
                    backgroundColor: COLORS.darkBackground,
                  },
                }),
              }}
            >
              <RootStack.Screen name="Main" component={BottomTabs} />
              <RootStack.Screen name="Auth" component={AuthStackScreens} />
              <RootStack.Screen name="Loading" component={LoadingScreen} /> 
            </RootStack.Navigator>
          </NavigationContainer>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  }
});

export default () => {
  return (
    <ForumProvider>
      <AuthProvider>
        <UserProvider>
          <ActivityProvider>
            <PostSurgeryProvider>
              <PreSurgeryProvider>
                <FriendsProvider>
                  <NotificationProvider>
                    <MessagesProvider>
                      <PainTrackingProvider>
                        <AssistantProvider>
                          <ContextConnector>
                            <App />
                          </ContextConnector>
                        </AssistantProvider>
                      </PainTrackingProvider>
                    </MessagesProvider>
                  </NotificationProvider>
                </FriendsProvider>
              </PreSurgeryProvider>
            </PostSurgeryProvider>
          </ActivityProvider>
        </UserProvider>
      </AuthProvider>
    </ForumProvider>
  );
}; 