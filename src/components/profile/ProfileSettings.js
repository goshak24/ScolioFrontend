import React from 'react';
import { View, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import SettingsSection from './SettingsSection';
import SettingItem from './SettingsItem';

const ProfileSettings = ({ 
  notificationsEnabled, 
  setNotificationsEnabled,
  reminderEnabled,
  setReminderEnabled,
  handleDeleteAccount,
  changePassword, 
  goToPrivacyPolicy
}) => {
  return (
    <View style={styles.settingsContainer}>
      <SettingsSection title="Account Settings">
        <SettingItem 
          icon="person-outline" 
          label="Edit Profile" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="notifications-outline" 
          label="Notifications" 
          isSwitch={true}
          switchValue={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
        <SettingItem 
          icon="time-outline" 
          label="Reminders" 
          isSwitch={true}
          switchValue={reminderEnabled}
          onToggle={setReminderEnabled}
        />
        <SettingItem 
          icon="lock-closed-outline" 
          label="Reset Password" 
          onPress={changePassword}
          isLast={true}
        />
      </SettingsSection>
      
      <SettingsSection title="App Settings">
        <SettingItem 
          icon="help-circle-outline" 
          label="Help Center" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="newspaper-outline" 
          label="Terms of Service" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="shield-outline" 
          label="Privacy Policy" 
          onPress={goToPrivacyPolicy}
          isLast={true}
        />
      </SettingsSection>
      
      <SettingsSection title="Data & GDPR">
        <SettingItem 
          icon="download-outline" 
          label="Download My Data" 
          onPress={() => {}}
        />
        <SettingItem 
          icon="trash-outline" 
          label="Delete My Account" 
          onPress={handleDeleteAccount}
          isLast={true}
        />
      </SettingsSection>
    </View>
  );
};

export default ProfileSettings;

const styles = StyleSheet.create({
  settingsContainer: {
    marginTop: moderateScale(15),
  },
}); 