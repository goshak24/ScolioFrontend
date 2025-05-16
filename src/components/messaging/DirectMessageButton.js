import React, { useContext } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../../constants/COLORS';
import { Context as MessagesContext } from '../../context/MessagesContext';

/**
 * A button component for initiating a direct message with a friend
 * @param {Object} props - Component props
 * @param {Object} props.user - The user to start a conversation with
 * @param {string} props.iconSize - Size of the icon (default: 18)
 * @param {string} props.color - Color of the icon (default: white)
 */
const DirectMessageButton = ({ user, iconSize = 18, color = COLORS.white }) => {
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
      }
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
      style={styles.button}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="chatbubble" 
        size={moderateScale(iconSize)} 
        color={color} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default DirectMessageButton; 