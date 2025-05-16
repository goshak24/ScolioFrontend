import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { moderateScale, scale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

/**
 * Component to display a single chat message
 * @param {string} text - Message content
 * @param {boolean} isUser - Whether the message is from the user (true) or AI (false)
 * @param {string} timestamp - When the message was sent
 * @param {string} aiAvatarUrl - URL for the AI avatar image (optional)
 */
const ChatMessage = ({ text, isUser, timestamp, aiAvatarUrl }) => {
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {/* AI Avatar (only shown for AI messages) */}
      {!isUser && (
        <View style={styles.avatarContainer}>
          {aiAvatarUrl ? (
            <Image source={{ uri: aiAvatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.defaultAvatarText}>AI</Text>
            </View>
          )}
        </View>
      )}
      
      {/* Message Content */}
      <View style={[
        styles.messageContent,
        isUser ? styles.userMessageContent : styles.aiMessageContent
      ]}>
        <Text style={styles.messageText}>{text}</Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    maxWidth: '95%',
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: moderateScale(8),
    alignSelf: 'flex-end',
    marginBottom: moderateScale(6),
  },
  avatar: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
  },
  defaultAvatar: {
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    backgroundColor: COLORS.gradientPurple,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  defaultAvatarText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: 'bold',
  },
  messageContent: {
    padding: moderateScale(12),
    borderRadius: moderateScale(18),
    maxWidth: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  userMessageContent: {
    backgroundColor: COLORS.gradientPurple,
    borderBottomRightRadius: moderateScale(4),
  },
  aiMessageContent: {
    backgroundColor: COLORS.cardDark,
    borderBottomLeftRadius: moderateScale(4),
  },
  messageText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  timestamp: {
    color: COLORS.lightGray,
    fontSize: moderateScale(10),
    marginTop: moderateScale(4),
    alignSelf: 'flex-end',
    opacity: 0.8,
  },
});

export default ChatMessage; 