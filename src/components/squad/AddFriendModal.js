import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import ReusableButton from '../reusable/ReusableButton';
import { Context as FriendsContext } from '../../context/FriendsContext';
import { Context as UserContext } from '../../context/UserContext'; 

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AddFriendModal = ({ visible, onClose }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { sendFriendRequestUsername, getFriends, getFriendRequests } = useContext(FriendsContext);
  const { state: userState } = useContext(UserContext);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setUsername('');
      setError('');
      setLoading(false);
    }
  }, [visible]);

  const handleSendFriendRequest = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    // Don't allow sending request to yourself
    if (username.trim().toLowerCase() === userState.user?.username?.toLowerCase()) {
      setError('You cannot send a friend request to yourself');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send the friend request using the found user's ID
      const result = await sendFriendRequestUsername(username);
      
      if (result.success) {
        // Show success message
        Alert.alert(
          'Success!', 
          `Friend request sent to ${username}!`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Refresh friends data and close modal
                getFriends(true);
                getFriendRequests(true);
                handleClose();
              }
            }
          ]
        );
      } else {
        setError(result.error || 'Failed to send friend request. Please try again.');
      }
    } catch (error) {
      console.error('Add friend error:', error);
      
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || 'Unknown error';
        
        if (status === 404) {
          setError('User not found. Please check the username and try again.');
        } else if (status === 400) {
          setError(message || 'Invalid request. Please check the username.');
        } else if (status === 409) {
          setError('You are already friends with this user or have already sent a request.');
        } else {
          setError(message || 'Failed to send friend request. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setUsername('');
      setError('');
      onClose();
    }
  };

  const handleInputChange = (text) => {
    setUsername(text);
    if (error) {
      setError(''); // Clear error when user starts typing
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.headerTitleContainer}>
                    <Ionicons 
                      name="person-add" 
                      size={moderateScale(24)} 
                      color={COLORS.gradientPink} 
                    />
                    <Text style={styles.modalTitle}>Add Friend</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Ionicons 
                      name="close" 
                      size={moderateScale(24)} 
                      color={COLORS.lightGray} 
                    />
                  </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.modalBody}>
                  <Text style={styles.description}>
                    Enter the username of the person you'd like to add as a friend.
                  </Text>

                  {/* Username Input */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons 
                        name="at" 
                        size={moderateScale(18)} 
                        color={COLORS.lightGray} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={username}
                        onChangeText={handleInputChange}
                        placeholder="Enter username"
                        placeholderTextColor={COLORS.lightGray}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                        maxLength={30}
                      />
                    </View>
                  </View>

                  {/* Error Message */}
                  {error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons 
                        name="alert-circle" 
                        size={moderateScale(16)} 
                        color={COLORS.error} 
                      />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Info */}
                  <View style={styles.infoContainer}>
                    <Ionicons 
                      name="information-circle" 
                      size={moderateScale(16)} 
                      color={COLORS.gradientPurple} 
                    />
                    <Text style={styles.infoText}>
                      They'll receive a notification about your friend request and can choose to accept or decline it.
                    </Text>
                  </View>
                </View>

                {/* Footer Buttons */}
                <View style={styles.modalFooter}>
                  <ReusableButton
                    btnText="Cancel"
                    fontSize={moderateScale(16)}
                    height={moderateScale(48)}
                    borderRadius={moderateScale(12)}
                    backgroundColor={COLORS.cardDark}
                    width="38%"
                    onPress={handleClose}
                    disabled={loading}
                  />
                  
                  <ReusableButton
                    btnText={loading ? "" : "Send Request"}
                    fontSize={moderateScale(16)}
                    height={moderateScale(48)}
                    borderRadius={moderateScale(12)}
                    gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
                    width="48%"
                    useGradient={true}
                    onPress={handleSendFriendRequest}
                    disabled={loading || !username.trim()}
                    style={[
                      styles.sendButton,
                      (!username.trim() || loading) && styles.disabledButton
                    ]}
                  >
                    {loading && (
                      <ActivityIndicator 
                        size="small" 
                        color={COLORS.white} 
                        style={styles.buttonLoader}
                      />
                    )}
                  </ReusableButton>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  modalContent: {
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(16),
    width: '100%',
    maxWidth: moderateScale(400),
    maxHeight: screenHeight * 0.8,
    borderWidth: 1,
    borderColor: COLORS.cardDark,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: moderateScale(10),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(20),
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardDark,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: moderateScale(12),
  },
  closeButton: {
    padding: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  modalBody: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
  },
  description: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(24),
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: moderateScale(8),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: COLORS.borderColor || '#2A2A2A',
    paddingHorizontal: moderateScale(16),
    height: moderateScale(52),
  },
  inputIcon: {
    marginRight: moderateScale(12),
  },
  textInput: {
    flex: 1,
    fontSize: moderateScale(16),
    color: COLORS.white,
    paddingVertical: 0, // Remove default padding
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorBackground || 'rgba(255, 59, 48, 0.1)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    marginBottom: moderateScale(16),
  },
  errorText: {
    fontSize: moderateScale(13),
    color: COLORS.error || '#FF3B30',
    marginLeft: moderateScale(8),
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.infoBackground || 'rgba(94, 92, 230, 0.1)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
  },
  infoText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginLeft: moderateScale(8),
    flex: 1,
    lineHeight: moderateScale(16),
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
    paddingTop: moderateScale(10),
    borderTopWidth: 1,
    borderTopColor: COLORS.cardDark,
  },
  sendButton: {
    position: 'relative',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonLoader: {
    position: 'absolute',
  },
});

export default AddFriendModal;
