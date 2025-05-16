import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS'; 
import api from '../../utilities/backendApi';

const MicTab = ({ onClose }) => { 

  const triggerAIVoice = async () => {
    try {
      const response = await api.post(
        '/assistant/call', 
        {
          assistantId: process.env.ASSISTANT_ID 
        }
      );
      console.log('Call initiated successfully:', response.data);
    } catch (error) {
      console.error('Call failed:', 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message
      );
      // Optional: Show error to user
      Alert.alert('Call Failed', error.response?.data?.error || 'Unable to start call'); 
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Mic Button */}
      <TouchableOpacity style={styles.micButton} onPress={triggerAIVoice}>
        <LinearGradient colors={["#9B34EF", "#E9338A"]} style={styles.micGradient}>
          <Ionicons name="mic" size={moderateScale(38)} color={COLORS.white} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Voice Prompt Text */}
      <Text style={styles.voicePrompt}>Tap the mic and ask me anything about scoliosis</Text>

      {/* Close Button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={moderateScale(24)} color={COLORS.lightGray} />
      </TouchableOpacity>
    </View>
  );
};

export default MicTab;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(16),
    position: 'relative',
  },
  micButton: {
    borderRadius: moderateScale(50),
    overflow: 'hidden',
  },
  micGradient: {
    width: moderateScale(60),
    height: moderateScale(60),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(50),
  },
  voicePrompt: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginTop: moderateScale(10),
  },
  closeButton: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
  },
}); 