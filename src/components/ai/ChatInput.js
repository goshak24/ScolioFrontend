import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import ReusableTextInput from '../reusable/ReusableTextInput';

/**
 * Chat input component with send button
 * @param {string} message - Current message text
 * @param {function} setMessage - Function to update message text
 * @param {function} handleSend - Function to handle sending message
 * @param {boolean} isLoading - Whether the AI is currently generating a response
 */
const ChatInput = ({ message, setMessage, handleSend, isLoading = false }) => {
  const inputRef = useRef(null);

  const onSend = () => {
    if (message.trim() && !isLoading) {
      handleSend();
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputWrapper}>
        <ReusableTextInput
          inputRef={inputRef}
          value={message}
          onChangeText={setMessage}
          placeholder="Ask me anything about scoliosis..."
          multiline={false}
          maxLength={1000}
          returnKeyType="default"
          onSubmitEditing={Keyboard.dismiss}
          containerStyle={styles.inputContainerStyle}
          style={styles.input}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!message.trim() || isLoading) ? styles.sendButtonDisabled : styles.sendButtonActive
          ]} 
          onPress={onSend}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <Ionicons name="hourglass-outline" size={moderateScale(20)} color={COLORS.white} />
          ) : (
            <Ionicons name="send" size={moderateScale(20)} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    backgroundColor: COLORS.cardDark,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerStyle: {
    flex: 1,
    marginRight: moderateScale(10),
  },
  input: {
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(15),
    minHeight: verticalScale(40),
    maxHeight: verticalScale(100),
  },
  sendButton: {
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.gradientPurple,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
});

export default ChatInput; 