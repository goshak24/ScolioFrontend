import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';

/**
 * ChatMessage component to render individual messages
 * @param {Object} message - The message object to render
 * @param {boolean} isOwnMessage - Whether the message is from the current user
 * @param {string} timestamp - Formatted timestamp for the message
 */
const ChatMessage = ({ message, isOwnMessage, timestamp }) => {
  return (
    <View 
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}
    >
      {isOwnMessage ? (
        // Own message with gradient background
        <LinearGradient
          colors={[COLORS.gradientPurple, COLORS.gradientPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ownMessage}
        >
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.messageTime}>{timestamp}</Text>
          {message.status === 'sending' && (
            <View style={styles.statusIndicator}>
              <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
            </View>
          )}
          {message.status === 'failed' && (
            <View style={styles.failedIndicator}>
              <Ionicons name="warning-outline" size={10} color="#ff5c5c" />
            </View>
          )}
        </LinearGradient>
      ) : (
        // Other user's message
        <View style={styles.otherMessage}>
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.messageTime}>{timestamp}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: moderateScale(5),
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  ownMessage: {
    borderRadius: moderateScale(15),
    padding: moderateScale(10),
    paddingBottom: moderateScale(6),
  },
  otherMessage: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(15),
    padding: moderateScale(10),
    paddingBottom: moderateScale(6),
  },
  messageText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: moderateScale(10),
    marginTop: moderateScale(4),
    alignSelf: 'flex-end',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: moderateScale(6),
    right: moderateScale(6),
  },
  failedIndicator: {
    position: 'absolute',
    bottom: moderateScale(6),
    right: moderateScale(6),
  },
});

export default ChatMessage;
