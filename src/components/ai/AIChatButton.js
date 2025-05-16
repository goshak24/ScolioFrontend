import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, scale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/COLORS';

/**
 * Chat button that transitions to chat interface when clicked
 * @param {function} onPress - Function to call when button is pressed
 */
const AIChatButton = ({ onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient 
        colors={[COLORS.gradientPurple, COLORS.gradientPink]} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.contentContainer}>
          <Ionicons name="chatbubble-ellipses" size={moderateScale(20)} color={COLORS.white} />
          <Text style={styles.buttonText}>Chat with AI Bestie</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: moderateScale(12),
    overflow: 'hidden', 
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradient: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(20),
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(10),
  },
});

export default AIChatButton; 