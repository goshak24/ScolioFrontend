import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

/**
 * A reusable text input component with consistent styling
 * 
 * @param {Object} props - Component props
 * @param {string} props.value - Current input value
 * @param {function} props.onChangeText - Function to handle text changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.secureTextEntry - Whether to hide text (for passwords)
 * @param {boolean} props.multiline - Whether to allow multiple lines
 * @param {number} props.maxLength - Maximum text length
 * @param {Object} props.style - Additional styles for the input
 * @param {Object} props.containerStyle - Additional styles for the container
 * @param {string} props.returnKeyType - Return key type (e.g., 'done', 'next')
 * @param {function} props.onSubmitEditing - Function called when submit button is pressed
 * @param {boolean} props.autoCapitalize - Auto capitalize behavior
 * @param {function} props.onContentSizeChange - Function for handling content size changes (for multiline)
 * @param {React.RefObject} props.inputRef - Ref for the TextInput
 * @returns {React.ReactNode}
 */
const ReusableTextInput = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  maxLength,
  style,
  containerStyle,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize = 'none',
  onContentSizeChange,
  inputRef,
  ...otherProps
}) => {
  // For multiline inputs that auto-expand
  const [inputHeight, setInputHeight] = useState(multiline ? verticalScale(40) : null);
  const localInputRef = useRef(null);
  const ref = inputRef || localInputRef;

  const handleContentSizeChange = (event) => {
    if (multiline && event.nativeEvent.contentSize) {
      const { height } = event.nativeEvent.contentSize;
      const newHeight = Math.min(
        Math.max(verticalScale(40), height), 
        verticalScale(100)
      );
      setInputHeight(newHeight);

      // Call parent's onContentSizeChange if provided
      if (onContentSizeChange) {
        onContentSizeChange(event);
      }
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        ref={ref}
        style={[
          styles.input,
          multiline && { textAlignVertical: 'top' },
          multiline && inputHeight && { height: inputHeight },
          Platform.OS === 'ios' && styles.inputIOS,
          style
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGray}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        autoCapitalize={autoCapitalize}
        onContentSizeChange={multiline ? handleContentSizeChange : undefined}
        blurOnSubmit={!multiline}
        textAlignVertical={Platform.OS === 'android' ? (multiline ? 'top' : 'center') : undefined}
        {...otherProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    backgroundColor: COLORS.cardDark,
    color: COLORS.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    fontSize: moderateScale(14),
  },
  inputIOS: {
    paddingVertical: moderateScale(12),
  },
});

export default ReusableTextInput; 