import React, { useState, useContext, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../../constants/COLORS';
import { Context as UserContext } from '../../context/UserContext';
import { Context as FriendsContext } from '../../context/FriendsContext';
import DirectMessageProfileButton from '../messaging/DirectMessageProfileButton';
import HeightSpacer from '../reusable/HeightSpacer';
import api from '../../utilities/backendApi'; 
import { getFileDownloadUrl } from '../../context/UserFunctionsHelper';

const UserProfileModal = ({ visible, onClose, userId }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestSending, setRequestSending] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const { state: userState } = useContext(UserContext);
  const { 
    state: friendsState, 
    sendFriendRequest, 
    getFriends,
    getFriendRequests 
  } = useContext(FriendsContext);

  // Load friends and requests when modal opens
  useEffect(() => {
    if (visible && userId) {
      getFriends();
      getFriendRequests();
    }
  }, [visible, userId]);

  // Check if user is already a friend or if request has been sent
  useEffect(() => {
    if (visible && userId && friendsState.friends && friendsState.friendRequests) {
      // Check if user is already a friend
      const existingFriend = friendsState.friends.find(friend => friend.id === userId);
      setIsFriend(!!existingFriend);

      // Check if we've already sent a request
      const existingRequest = friendsState.friendRequests.find(
        request => request.user.id === userId && request.type === 'sent'
      );
      setRequestSent(!!existingRequest);
    }
  }, [visible, userId, friendsState.friends, friendsState.friendRequests]);

  // Load avatar URL when userProfile changes
  useEffect(() => {
    const loadAvatarUrl = async () => {
      if (!userProfile?.avatar) {
        setAvatarUrl(null);
        return;
      }

      try {
        setAvatarLoading(true);
        setImageError(false);
        
        console.log('Loading avatar for path:', userProfile.avatar);
        const url = await getFileDownloadUrl(userProfile.avatar);
        
        if (url) {
          console.log('Avatar URL loaded successfully:', url);
          setAvatarUrl(url);
        } else {
          console.log('No avatar URL returned, using default');
          setAvatarUrl(null);
          setImageError(true);
        }
      } catch (error) {
        console.log('Error loading avatar URL:', error);
        setAvatarUrl(null);
        setImageError(true);
      } finally {
        setAvatarLoading(false);
      }
    };

    loadAvatarUrl();
  }, [userProfile?.avatar]);

  // Fetch user profile data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!visible || !userId) {
        return;
      }

      setLoading(true);
      setError(null);
      setImageError(false);
      setAvatarUrl(null); // Reset avatar state

      try {
        console.log(`Fetching profile for user: ${userId}`);
        const response = await api.get(`/forum/profile/${userId}`);

        console.log(response.data)
        
        if (response.data) {
          console.log('User profile fetched successfully:', response.data);
          setUserProfile(response.data);
        } else {
          throw new Error('No profile data received');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        
        // Handle different types of errors
        if (err.response) {
          const status = err.response.status;
          const message = err.response.data?.error || 'Unknown error';
          
          if (status === 404) {
            setError('User not found');
          } else if (status === 401) {
            setError('Authentication required');
          } else if (status === 403) {
            setError('Access denied');
          } else {
            setError(`Error: ${message}`);
          }
        } else if (err.request) {
          setError('Network error - please check your connection');
        } else {
          setError('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [visible, userId]);
  
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  const handleAddFriend = async () => {
    // Don't do anything if it's our own profile
    if (userId === userState.user?.uid) {
      Alert.alert("Cannot add yourself", "You cannot send a friend request to yourself");
      return;
    }
  
    if (isFriend) {
      // If already friends, we could show a menu to remove friend, etc.
      Alert.alert(
        "Already Friends",
        "You are already friends with this user.",
        [{ text: "OK" }]
      );
      return;
    }
  
    if (requestSent) {
      Alert.alert(
        "Request Already Sent",
        "You have already sent a friend request to this user.",
        [{ text: "OK" }]
      );
      return;
    }
  
    try {
      setRequestSending(true);
      const result = await sendFriendRequest(userId);
      setRequestSending(false);
      
      if (result.success) {
        setRequestSent(true);
        Alert.alert("Success", "Friend request sent!");
      } else {
        Alert.alert("Error", result.error || "Failed to send friend request");
      }
    } catch (error) {
      setRequestSending(false);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  const handleImageError = () => {
    console.log('Image failed to load, showing fallback');
    setImageError(true);
  };

  const renderProfileImage = () => {
    // Show loading spinner while avatar is being loaded
    if (avatarLoading) {
      return (
        <View style={[styles.profileAvatar, styles.defaultAvatarContainer]}>
          <ActivityIndicator size="small" color={COLORS.gradientPink} />
        </View>
      );
    }

    // Show default avatar if no image URL, if image failed to load, or if we couldn't get the URL
    if (!avatarUrl || imageError) {
      return (
        <View style={[styles.profileAvatar, styles.defaultAvatarContainer]}>
          <Ionicons 
            name="person" 
            size={moderateScale(50)} 
            color={COLORS.lightGray} 
          />
        </View>
      );
    }

    return (
      <Image 
        source={{ uri: avatarUrl }} 
        style={styles.profileAvatar}
        onError={handleImageError}
        onLoadStart={() => setImageError(false)}
      />
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple} 
        translucent={false} 
      />
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* Header with close button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>User Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={moderateScale(24)} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Profile content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gradientPink} />
                <HeightSpacer height={10} />
                <Text style={styles.loadingText}>Loading profile...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={moderateScale(40)} color={COLORS.gradientPink} />
                <HeightSpacer height={10} />
                <Text style={styles.errorText}>Failed to load profile</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
              >
                {/* Profile Header Section */}
                <View style={styles.profileHeader}>
                  {renderProfileImage()}
                  <Text style={styles.username}>{userProfile.username}</Text>
                  <Text style={styles.joinDate}>Joined {formatDate(userProfile.joinDate)}</Text>
                  
                  {/* Treatment Stage Badge */}
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{userProfile.treatmentStage}</Text>
                  </View>
                </View>

                <HeightSpacer height={20} />

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userProfile.stats.posts}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userProfile.stats.comments}</Text>
                    <Text style={styles.statLabel}>Comments</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{userProfile.stats.streaks}</Text>
                    <Text style={styles.statLabel}>Streaks</Text>
                  </View>
                </View>

                <HeightSpacer height={20} />

                {/* Bio Section */}
                <View style={styles.bioContainer}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.bioText}>{userProfile.bio}</Text>
                </View>

                <HeightSpacer height={30} />

                {/* Add Friend Button - conditionally render based on status */}
                {userId !== userState.user?.uid && (
                  <>
                    <TouchableOpacity 
                      style={[
                        styles.addFriendButton,
                        isFriend && styles.alreadyFriendButton,
                        requestSent && styles.requestSentButton
                      ]} 
                      onPress={handleAddFriend}
                      disabled={requestSending || isFriend || requestSent}
                    >
                      {requestSending ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons 
                            name={
                              isFriend ? "people" : 
                              requestSent ? "checkmark-circle" : "person-add"
                            } 
                            size={moderateScale(20)} 
                            color={COLORS.white} 
                          />
                          <Text style={styles.addFriendText}>
                            {isFriend ? "Friends" : 
                             requestSent ? "Request Sent" : "Add Friend"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                    
                    {/* Direct Message Button - Only show if they are friends */}
                    {isFriend && (
                      <DirectMessageProfileButton user={userProfile} />
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    alignSelf: 'center',
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginTop: verticalScale(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(15),
    backgroundColor: COLORS.cardDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: moderateScale(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  loadingText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  errorText: {
    color: COLORS.gradientPink,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginTop: verticalScale(5),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: moderateScale(15),
  },
  profileHeader: {
    alignItems: 'center',
    padding: moderateScale(15),
  },
  profileAvatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: 3,
    borderColor: COLORS.gradientPurple,
  },
  defaultAvatarContainer: {
    backgroundColor: COLORS.cardDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: verticalScale(10),
  },
  joinDate: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    marginTop: verticalScale(5),
  },
  badgeContainer: {
    backgroundColor: COLORS.badgeBackground,
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(5),
    borderRadius: moderateScale(15),
    marginTop: verticalScale(10),
  },
  badgeText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginTop: verticalScale(5),
  },
  bioContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(10),
  },
  bioText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  addFriendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: verticalScale(20),
  },
  alreadyFriendButton: {
    backgroundColor: COLORS.badgeBackground,
  },
  requestSentButton: {
    backgroundColor: COLORS.accentGreen,
  },
  addFriendText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: moderateScale(10),
  }
});

export default UserProfileModal;