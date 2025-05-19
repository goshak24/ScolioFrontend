import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import COLORS from '../../../constants/COLORS';

/**
 * Chat header component with user info and back button
 * @param {Object} otherUser - The user being chatted with
 * @param {Function} onBackPress - Function to handle back button press
 * @param {Function} onUserPress - Function to handle user info press
 */
const ChatHeader = ({ otherUser, onBackPress, onUserPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={onBackPress}
      >
        <Ionicons name="chevron-back" size={moderateScale(24)} color={COLORS.white} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={onUserPress}
      >
        <Image
          source={{ uri: otherUser.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
          style={styles.avatar}
        />
        <View style={styles.userTextInfo}>
          <Text style={styles.username}>{otherUser.username || 'Unknown User'}</Text>
          <Text style={styles.userStatus}>
            {otherUser.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.placeholderView} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(5) : moderateScale(8),
    padding: moderateScale(15),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: COLORS.darkBackground,
  },
  backButton: {
    padding: moderateScale(5),
    width: moderateScale(30),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: moderateScale(10),
  },
  avatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    marginRight: moderateScale(10),
  },
  userTextInfo: {
    justifyContent: 'center',
  },
  username: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  userStatus: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  placeholderView: {
    width: moderateScale(30),
  },
});

export default ChatHeader;
