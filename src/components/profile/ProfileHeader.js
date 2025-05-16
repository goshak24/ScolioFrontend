import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';

const ProfileHeader = ({ user, updateUser }) => {
  const [bio, setBio] = useState(user?.bio || "Add a bio to tell others about yourself...");
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveBio = () => {
    setIsEditing(false);
    // Call updateUser function to save the bio if it exists
    if (updateUser) {
      updateUser({ ...user, bio });
    }
  };
  
  return (
    <View style={styles.profileSection}>
      <LinearGradient 
        colors={["#B15EFF", "#EA6AB5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarContainer}
      >
        <Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() || 'U'}</Text>
      </LinearGradient>
      
      <View style={styles.profileInfo}>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'No email'}</Text>
        
        <View style={styles.bioContainer}>
          {isEditing ? (
            <View style={styles.bioEditContainer}>
              <TextInput
                style={styles.bioInput}
                value={bio}
                onChangeText={setBio}
                multiline
                maxLength={150}
                placeholder="Tell others about yourself..."
                placeholderTextColor={COLORS.lightGray}
              />
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveBio}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.bioTextContainer}
              onPress={() => setIsEditing(true)}
            >
              <Text 
                style={[
                  styles.bioText, 
                  !user?.bio && styles.bioPlaceholder
                ]}
                numberOfLines={3}
              >
                {bio}
              </Text>
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={16} color={COLORS.lightGray} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    marginTop: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  avatarContainer: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  avatarText: {
    fontSize: moderateScale(40),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  username: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  email: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginBottom: moderateScale(10),
  },
  bioContainer: {
    width: '90%',
    marginTop: moderateScale(5),
    marginBottom: moderateScale(10),
  },
  bioTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
  },
  bioText: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  bioPlaceholder: {
    color: COLORS.lightGray,
    fontStyle: 'italic',
  },
  editIconContainer: {
    marginLeft: moderateScale(5),
    alignSelf: 'flex-start',
  },
  bioEditContainer: {
    width: '100%',
  },
  bioInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    color: COLORS.white,
    textAlignVertical: 'top',
    minHeight: moderateScale(80),
    fontSize: moderateScale(14),
  },
  saveButton: {
    backgroundColor: COLORS.primaryPurple,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(15),
    alignSelf: 'center',
    marginTop: moderateScale(10),
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
}); 