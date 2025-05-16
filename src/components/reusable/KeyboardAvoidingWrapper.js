import React from 'react';
import { 
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform, 
  StyleSheet,
  View,
  Dimensions
} from 'react-native';

/**
 * A reusable component to handle keyboard behavior across different platforms
 * This wrapper maintains consistent styling on both iOS and Android
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The content to render inside the keyboard avoiding view
 * @param {Object} props.style - Additional styles for the container
 * @param {Object} props.contentContainerStyle - Styles for the ScrollView content container
 * @param {Boolean} props.withScrollView - Whether to wrap content in a ScrollView (default: true)
 * @param {Number} props.keyboardVerticalOffset - Offset from the top (useful when you have headers)
 * @returns {React.ReactNode}
 */
const KeyboardAvoidingWrapper = ({ 
  children, 
  style, 
  contentContainerStyle,
  withScrollView = true,
  keyboardVerticalOffset = 0
}) => {
  const screenWidth = Dimensions.get('window').width;
  
  const renderContent = () => {
    if (withScrollView) {
      return (
        <ScrollView
          contentContainerStyle={[
            styles.scrollViewContent, 
            { width: screenWidth }, // Ensure consistent width on both platforms
            contentContainerStyle
          ]}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      );
    }
    
    return (
      <View style={[
        styles.container, 
        { width: screenWidth }, // Ensure consistent width on both platforms
        contentContainerStyle
      ]}>
        {children}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {renderContent()}
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'center', // Center content on both platforms
  },
  scrollViewContent: {
    flexGrow: 1,
    alignSelf: 'center', // Center content on both platforms
  },
});

export default KeyboardAvoidingWrapper; 