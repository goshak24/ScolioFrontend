import React, { useState, useContext, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  StatusBar, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { useNavigation } from '@react-navigation/native';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import ReusableSearchBar from '../reusable/ReusableSearchBar';
import ReusableButton from '../reusable/ReusableButton';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import { Context as GroupsContext } from '../../context/GroupsContext';
import HeightSpacer from '../reusable/HeightSpacer';

const GroupsInterface = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  
  const { 
    state: GroupsState, 
    getAllGroups, 
    getUserGroups, 
    joinGroup, 
    createGroup, 
    getGroupDetails,
    setError 
  } = useContext(GroupsContext);

  // Load groups on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await getAllGroups();
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

     // Filter groups based on search text
   const filteredGroups = useMemo(() => {
     if (!searchText.trim()) {
       return GroupsState.groups || [];
     }
     
     const searchLower = searchText.toLowerCase();
     return (GroupsState.groups || []).filter(group => 
       group.name.toLowerCase().includes(searchLower) ||
       group.description.toLowerCase().includes(searchLower) ||
       (group.tags && group.tags.some(tag => tag.toLowerCase().includes(searchLower)))
     );
   }, [GroupsState.groups, searchText]);

   // Handle refresh
   const onRefresh = async () => {
     setRefreshing(true);
     try {
       await getAllGroups({ search: searchText });
     } catch (error) {
       console.error('Error refreshing groups:', error);
     } finally {
       setRefreshing(false);
     }
   };

   // Handle join group
   const handleJoinGroup = async (groupId) => {
     try {
       await joinGroup(groupId);
       Alert.alert('Success', 'Successfully joined the group!');
       // Refresh groups to update UI
       getAllGroups();
     } catch (error) {
       Alert.alert('Error', error.message || 'Failed to join group');
     }
   };

   // Handle search change
   const handleSearchChange = (text) => {
     setSearchText(text);
   };

   // Navigate to group chat
   const navigateToGroupChat = async (group) => {
     try {
       // Check if user is a member or if it's a public group
       if (group.visibility === 'private') {
         // For private groups, we need to check membership or join first
         try {
           const groupDetails = await getGroupDetails(group.id);
           if (!groupDetails.isUserMember) {
             Alert.alert(
               'Private Group',
               'This is a private group. You need to join first.',
               [
                 { text: 'Cancel', style: 'cancel' },
                 { 
                   text: 'Join', 
                   onPress: async () => {
                     try {
                       await handleJoinGroup(group.id);
                       navigation.navigate('GroupChatScreen', { groupId: group.id });
                     } catch (error) {
                       console.error('Error joining group:', error);
                     }
                   }
                 }
               ]
             );
             return;
           }
         } catch (error) {
           console.error('Error checking group membership:', error);
           Alert.alert('Error', 'Unable to access group details');
           return;
         }
       }
       
       // Navigate to group chat screen
       navigation.navigate('GroupChatScreen', { groupId: group.id });
     } catch (error) {
       console.error('Error navigating to group chat:', error);
       Alert.alert('Error', 'Unable to open group chat');
     }
   };

   // Handle create group modal
   const handleOpenCreateModal = () => {
     setShowCreateModal(true);
   };

   const handleCloseCreateModal = () => {
     setShowCreateModal(false);
     // Refresh groups after creating a new one
     loadInitialData();
   };

   // Handle join group modal
   const handleOpenJoinModal = () => {
     setShowJoinModal(true);
   };

   const handleCloseJoinModal = () => {
     setShowJoinModal(false);
     // Refresh groups after joining
     loadInitialData();
   };

  const renderGroupCard = (group) => (
    <TouchableOpacity 
      key={group.id} 
      style={styles.groupCard}
      onPress={() => navigateToGroupChat(group)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupDescription}>{group.description}</Text>
          
          <View style={styles.groupMeta}>
            <View style={styles.memberInfo}>
              <Ionicons 
                name="people" 
                size={moderateScale(12)} 
                color={COLORS.lightGray} 
              />
              <Text style={styles.memberCount}>{group.memberCount} members</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.groupStatus}>
          <Text style={[
            styles.activeText,
            group.isActive && styles.activeNow
          ]}>
            {group.lastActive}
          </Text>
          {group.hasNotification && (
            <View style={styles.notificationDot} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.darkBackground} 
        translucent={false} 
      />

      {/* Content */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.gradientPink]}
            tintColor={COLORS.gradientPink}
          />
        }
      >
        <View style={styles.content}>
          {/* Group Chats Header with Create and Join Buttons */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Group Chats</Text>
            <View style={styles.headerButtons}>
              <ReusableButton
                btnText="+ Create"
                fontSize={moderateScale(14)}
                height={moderateScale(32)}
                borderRadius={moderateScale(20)}
                gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
                width="auto"
                useGradient={true}
                onPress={handleOpenCreateModal}
                style={styles.headerButton}
              />
              <ReusableButton
                btnText="Join Group"
                fontSize={moderateScale(14)}
                height={moderateScale(32)}
                borderRadius={moderateScale(20)}
                backgroundColor={COLORS.cardDark}
                width="auto"
                style={styles.headerButton}
                onPress={handleOpenJoinModal}
              />
            </View>
          </View>

          <HeightSpacer height={moderateScale(5)} /> 
          
          {/* Loading State */}
          {GroupsState.loading && !refreshing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.gradientPink} />
              <Text style={styles.loadingText}>Loading groups...</Text>
            </View>
          )}

          {/* Error State */}
          {GroupsState.error && !GroupsState.loading && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={moderateScale(48)} color={COLORS.lightGray} />
              <Text style={styles.errorText}>{GroupsState.error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadInitialData}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Groups List */}
          {!GroupsState.loading && !GroupsState.error && (
            <View style={styles.groupsContainer}>
              {filteredGroups.length > 0 ? (
                filteredGroups.map(renderGroupCard)
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="people" size={moderateScale(48)} color={COLORS.lightGray} />
                  <Text style={styles.emptyText}>
                    {searchText ? 'No groups found' : 'No groups available'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchText ? 'Try adjusting your search terms' : 'Create the first group to get started!'}
                  </Text>
                  {!searchText && (
                    <ReusableButton
                      btnText="+ Create Your First Group"
                      fontSize={moderateScale(14)}
                      height={moderateScale(40)}
                      borderRadius={moderateScale(20)}
                      gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
                      width="auto"
                      useGradient={true}
                      onPress={handleOpenCreateModal}
                      style={styles.createFirstGroupButton}
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={handleCloseCreateModal}
      />

      {/* Join Group Modal */}
      <JoinGroupModal
        visible={showJoinModal}
        onClose={handleCloseJoinModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10),
    paddingBottom: moderateScale(15),
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  searchButton: {
    padding: moderateScale(8),
  },
  searchContainer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(15),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
  },
  searchIcon: {
    marginRight: moderateScale(10),
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: moderateScale(14),
    paddingVertical: moderateScale(12),
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(20),
  },
  tab: {
    flex: 1,
    marginHorizontal: moderateScale(2),
  },
  tabGradient: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  inactiveTab: {
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(16),
    alignItems: 'center',
  },
  activeTab: {
    borderRadius: moderateScale(8),
  },
  tabText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS.lightGray,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  inactiveTabText: {
    color: COLORS.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: moderateScale(8),
  },
  headerButton: {
    marginLeft: moderateScale(4), // Small margin for spacing
  },
  joinButton: {
    borderRadius: moderateScale(20),
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginLeft: moderateScale(4),
  },
  groupsContainer: {
    gap: moderateScale(12),
  },
  groupCard: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupInfo: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  groupName: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(4),
  },
  groupDescription: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(8),
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberCount: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginLeft: moderateScale(4),
  },
  groupStatus: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: moderateScale(50),
  },
  activeText: {
    fontSize: moderateScale(11),
    color: COLORS.lightGray,
  },
  activeNow: {
    color: COLORS.accentGreen,
    fontWeight: '500',
  },
  notificationDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: COLORS.primaryPurple,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  loadingText: {
    color: COLORS.white,
    marginTop: moderateScale(10),
    fontSize: moderateScale(14),
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  errorText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.gradientPurple,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: moderateScale(40),
  },
  emptyText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginTop: moderateScale(16),
    marginBottom: moderateScale(8),
  },
  emptySubtext: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    paddingHorizontal: moderateScale(30),
    marginBottom: moderateScale(20),
  },
  createFirstGroupButton: {
    marginTop: moderateScale(10),
  },
});

export default GroupsInterface;