import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';

/**
 * ChatInput component for typing and sending messages
 * @param {string} messageText - The current message text
 * @param {Function} onChangeText - Function to handle text changes
 * @param {Function} onSendPress - Function to handle send button press
 * @param {boolean} loading - Whether a message is being sent
 * @param {Function} onFocus - Optional focus handler to notify parent
 * @param {Function} onInputContentSizeChange - Optional content size change handler for multiline growth
 */
const ChatInput = ({ messageText, onChangeText, onSendPress, loading = false, onFocus, onInputContentSizeChange }) => {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.messageInput}
        placeholder="Type a message..."
        placeholderTextColor={COLORS.lightGray}
        value={messageText}
        onChangeText={onChangeText}
        multiline
        onFocus={onFocus}
        onContentSizeChange={onInputContentSizeChange}
      />
      <TouchableOpacity 
        style={styles.sendButton}
        onPress={onSendPress}
        disabled={!messageText || !messageText.trim() || loading}
      >
        <LinearGradient
          colors={loading ? [COLORS.lightGray, COLORS.lightGray] : [COLORS.gradientPurple, COLORS.gradientPink]}
          style={styles.sendButtonGradient}
        >
          <Ionicons 
            name={loading ? "hourglass-outline" : "send"} 
            size={moderateScale(20)} 
            color={COLORS.white} 
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: COLORS.darkBackground,
  },
  messageInput: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    color: COLORS.white,
    maxHeight: moderateScale(100),
    fontSize: moderateScale(14),
  },
  sendButton: {
    marginLeft: moderateScale(10),
  },
  sendButtonGradient: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatInput;
