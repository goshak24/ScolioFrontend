import { StyleSheet, Text, View, ActivityIndicator, ScrollView, Alert, SafeAreaView, StatusBar, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext'; 
import { Context as ActivityContext } from '../context/ActivityContext';
import { Context as PainTrackingContext } from '../context/PainTrackingContext';
import { navigate, goBack } from '../components/navigation/navigationRef';
import COLORS from '../constants/COLORS';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import ReusableButton from '../components/reusable/ReusableButton';
import BackButton from '../components/reusable/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import HeightSpacer from '../components/reusable/HeightSpacer';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';

// Import profile components
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileSettings from '../components/profile/ProfileSettings';

const ProfileScreen = () => {
  const { logout, deleteUserAccount, resetPassword, state: { loading } } = useContext(AuthContext);
  const { state: { user }, resetUser, updateUser, deleteUserAccountData, updateProfilePicture } = useContext(UserContext); 
  const { resetActivity } = useContext(ActivityContext);
  const { clearPainLogs } = useContext(PainTrackingContext);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  
  // Function to handle user bio update
  const handleUpdateUser = (updatedUser) => {
    if (updateUser) {
      updateUser(updatedUser);
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await resetUser();
              await resetActivity(); // Await resetActivity since it's async now
              await logout();
              navigate("Auth");
            } catch (error) {
              console.error("Logout failed:", error);
            } finally {
              setIsLoggingOut(false);
            }
          } 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirm Deletion",
              "Please confirm that you want to permanently delete your account. This action CANNOT be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Permanently Delete",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteUserAccount();   // Delete from backend
                      await deleteUserAccountData();     // Reset local user state
                      await resetActivity();             // Await resetActivity
                      await logout();              // Clear auth tokens 
                      await clearPainLogs();       // Clears pain logs from AsyncStorage 
                      navigate("Auth");            // Redirect to login
                    } catch (err) {
                      console.error("Account deletion failed:", err);
                      Alert.alert("Error", "There was a problem deleting your account. Please try again.");
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  }; 

  const changePassword = async () => {
    try {
      const result = await resetPassword(user.email);
      
      if (result.success) {
        Alert.alert(
          "Password Reset",
          "A password reset email has been sent to your email address. Please check your inbox and follow the instructions.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          result.error || "Failed to send reset password email. Please try again later.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An unexpected error occurred. Please try again later.",
        [{ text: "OK" }]
      );
    }
  } 

  const goToPrivacyPolicy = () => { 
    navigate('PrivacyPolicy')
  }

  const changeProfilePicture = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required", "App needs access to your photo library.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log("Selected image URI:", imageUri);
        
        setUploadingImage(true);
        
        // Upload image to server and update user profile
        const response = await updateProfilePicture(imageUri);
        
        if (response.success) {
          Alert.alert("Success", "Profile picture updated successfully");
        } else {
          Alert.alert("Error", response.error || "Failed to update profile picture");
        }
      }
    } catch (error) {
      console.error("Profile picture update error:", error);
      Alert.alert("Error", "An error occurred while updating your profile picture");
    } finally {
      setUploadingImage(false);
    }
  };
  
  if (loading || isLoggingOut || !user || uploadingImage) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.backgroundPurple, COLORS.darkBackground]}
          style={styles.gradientBackground}
        >
          <ActivityIndicator size="large" color={COLORS.white} />
          {uploadingImage && <Text style={styles.loadingText}>Updating profile picture...</Text>}
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple}  
        translucent={false} 
      />
      
      <LinearGradient
        colors={[COLORS.backgroundPurple, COLORS.darkBackground]}
        style={styles.gradientBackground}
      >
        <View style={{width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
        {/* Back button using the reusable component */}
          <BackButton 
            onPress={() => goBack()}
            iconColor={COLORS.white}
            buttonColor="transparent"
            padding={moderateScale(10)}
            size={moderateScale(23)}
            iconName="arrow-back" 
            top={Platform.OS === 'android' ? verticalScale(40) : verticalScale(0)}
          />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </View>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          overScrollMode="never"
          bounces={false}
        >
          {/* Profile Header with Avatar and User Info */}
          <ProfileHeader user={user} updateUser={handleUpdateUser} changeProfilePicture={changeProfilePicture} />
          
          {/* User Stats */}
          <ProfileStats user={user} />
          
          {/* Settings Sections */}
          <ProfileSettings 
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            reminderEnabled={reminderEnabled}
            setReminderEnabled={setReminderEnabled}
            handleDeleteAccount={handleDeleteAccount}
            changePassword={changePassword}
            goToPrivacyPolicy={goToPrivacyPolicy}
          />
          
          <HeightSpacer height={moderateScale(15)} />
          
          {/* Logout Button */}
          <View style={{alignItems: 'center'}}>
            <ReusableButton 
              btnText="Log Out"
              onPress={handleLogout}
              width="90%"
              height={moderateScale(45)}
              fontSize={moderateScale(16)}
              useGradient={false}
              backgroundColor={COLORS.workoutOption}
              textColor={COLORS.white}
              borderWidth={1}
              borderColor="rgba(255, 255, 255, 0.2)"
            />
          </View>
          
          {/* App Version */}
          <Text style={styles.versionText}>
            Version {Constants.expoConfig?.version || '1.0.0'}
          </Text>
          
          <HeightSpacer height={moderateScale(15)} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPurple,
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPurple
  },
  loadingText: {
    color: COLORS.white,
    marginTop: moderateScale(10),
    fontSize: moderateScale(14),
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(5) : moderateScale(8),
    paddingBottom: moderateScale(15), 
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  versionText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    textAlign: 'center',
    marginTop: moderateScale(10),
  },
});