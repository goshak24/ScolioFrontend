import React, { useContext } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/COLORS';
import { Context as MessagesContext } from '../../context/MessagesContext';

/**
 * A button component for initiating a direct message with a user from their profile
 * @param {Object} props - Component props
 * @param {Object} props.user - The user to start a conversation with
 */
const DirectMessageProfileButton = ({ user }) => {
  const navigation = useNavigation();
  const { getMessages, startConversation } = useContext(MessagesContext);

  const handlePress = async () => {
    if (!user || !user.id) {
      Alert.alert("Error", "Unable to start conversation with this user");
      return;
    }

    try {
      const conversation = await getMessages(user.id);
      if (!conversation) {
        await startConversation(user.id);
      } else {
        // Navigate to the chat screen
      navigation.navigate('ChatScreen', { 
        otherUser: {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        }
        });
      }; 
    } catch (error) {
      console.error('Error initiating conversation:', error);
      Alert.alert(
        "Error Starting Conversation", 
        "There was an issue creating a conversation. Please make sure you're connected to the internet and try again.",
        [{ text: "OK" }]
      );
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.buttonContainer}
    >
      <LinearGradient
        colors={[COLORS.gradientPurple, COLORS.gradientPink]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Ionicons 
          name="chatbubble" 
          size={moderateScale(16)} 
          color={COLORS.white} 
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Message</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginVertical: moderateScale(10),
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(20),
  },
  icon: {
    marginRight: moderateScale(8),
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  }
});

export default DirectMessageProfileButton; 