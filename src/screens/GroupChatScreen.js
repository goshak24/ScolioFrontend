import React, { useState, useContext, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  Modal,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';

import COLORS from '../constants/COLORS';
import { Context as GroupsContext } from '../context/GroupsContext';
import { Context as AuthContext } from '../context/AuthContext';
import { Context as UserContext } from '../context/UserContext'; 
import ChatInput from '../components/messaging/chat/ChatInput';
import HeightSpacer from '../components/reusable/HeightSpacer';
import { formatMessageDayLabel, getDayKey, formatMessageTime } from '../components/messaging/chat/utils';

const GroupChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { groupId } = route.params; 
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [groupDetails, setGroupDetails] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [members, setMembers] = useState([]); 
  
  const flatListRef = useRef(null);
  const prevMessageCountRef = useRef(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const { 
    state: GroupsState, 
    getGroupDetails, 
    getGroupMembers,
    getGroupMessages, 
    sendMessage, 
    leaveGroup,
    setError,
    listenToGroupMessages,
    kickMember: kickMemberAction,
    banMember: banMemberAction
  } = useContext(GroupsContext);
  
  const { state: AuthState } = useContext(AuthContext);
  const { state: UserState } = useContext(UserContext);
  
  const currentUserId = AuthState.userId || UserState.user?.uid;

  // Keep local messages in sync with context listener data
  useEffect(() => {
    const ctxMessages = GroupsState.groupMessages?.[groupId] || [];
    setMessages(ctxMessages);
  }, [GroupsState.groupMessages, groupId]);

  useEffect(() => {
    loadGroupData();
    // Start realtime listener only while inside this chat
    const unsubscribe = listenToGroupMessages && listenToGroupMessages(groupId);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [groupId]);

  // Fetch members on demand when modal opens
  useEffect(() => {
    const loadMembers = async () => {
      try {
        if (showMembersModal && getGroupMembers) {
          const fetched = await getGroupMembers(groupId);
          if (Array.isArray(fetched)) setMembers(fetched);
        }
      } catch (e) {}
    };
    loadMembers();
  }, [showMembersModal, groupId]);

  // Keep list anchored to bottom on keyboard events
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const currentCount = messages?.length || 0;
    if (currentCount === 0) return;
    const prev = prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;
    if (currentCount >= prev) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group details and messages in parallel
    const [detailsResult] = await Promise.allSettled([
      getGroupDetails(groupId, { includeMembers: false }),
      loadMessages()
    ]);
      
      if (detailsResult.status === 'fulfilled') {
        setGroupDetails(detailsResult.value.group);
        // Do not fetch members here; fetch on demand when modal opens
      }
      
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      
      // Try to use cached first; only force on explicit user refresh
      const messagesData = await getGroupMessages(groupId, { limit: 50, force: !!refresh });
      setMessages(messagesData || []);
      
      // Scroll to bottom after loading messages
      setTimeout(() => {
        if (flatListRef.current && messagesData?.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      if (!refresh) {
        Alert.alert('Error', 'Failed to load messages');
      }
    } finally {
      if (refresh) setRefreshing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    const textToSend = messageText.trim();
    setMessageText(''); // Clear input immediately
    
    try {
      setSendingMessage(true);
      
      const senderName = UserState.user?.username || UserState.user?.name || 'You';
      await sendMessage(groupId, {
        text: textToSend,
        messageType: 'text',
        senderName,
        senderId: currentUserId
      });
      // Do not reload; realtime listener will append the message
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Restore message text if sending failed
      setMessageText(textToSend);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${groupDetails?.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(groupId);
              Alert.alert('Success', 'You have left the group');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave group');
            }
          }
        }
      ]
    );
  };

  // Build interleaved data with day separators
  const listData = useMemo(() => {
    const data = [];
    let prevDayKey = null;
    for (let i = 0; i < (messages?.length || 0); i += 1) {
      const msg = messages[i];
      const dayKey = getDayKey(msg?.createdAt);
      if (dayKey && dayKey !== prevDayKey) {
        data.push({ type: 'separator', key: `sep-${dayKey}-${i}`, label: formatMessageDayLabel(msg?.createdAt) });
        prevDayKey = dayKey;
      }
      data.push({ type: 'message', key: msg.id || `msg-${i}`, data: msg, index: i });
    }
    return data;
  }, [messages]);

  const renderItem = ({ item }) => {
    if (item.type === 'separator') {
      return (
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <View style={styles.separatorLabelContainer}>
            <Text style={styles.separatorLabelText}>{item.label}</Text>
          </View>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const m = item.data;
    const isCurrentUser = m.senderId === currentUserId;
    const isSystemMessage = m.messageType === 'system';
    const prevMessage = item.index > 0 ? messages[item.index - 1] : null;
    const showSenderName = !isCurrentUser && !isSystemMessage && 
      (prevMessage?.senderId !== m.senderId || prevMessage?.messageType === 'system');

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{m.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {showSenderName && (
          <Text style={styles.senderName}>{m.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {m.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {formatMessageTime(m.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const renderGroupInfo = () => (
    <View style={styles.groupInfoContainer}>
      <Text style={styles.groupName}>{groupDetails?.name}</Text>
      <Text style={styles.groupDescription}>{groupDetails?.description}</Text>
      <Text style={styles.groupDescription}>Group ID: {groupId}</Text>
      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Ionicons name="people" size={moderateScale(16)} color={COLORS.lightGray} />
          <Text style={styles.statText}>{groupDetails?.memberCount} members</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons 
            name={groupDetails?.isActive ? "ellipse" : "ellipse-outline"} 
            size={moderateScale(8)} 
            color={groupDetails?.isActive ? COLORS.accentGreen : COLORS.lightGray} 
          />
          <Text style={styles.statText}>{groupDetails?.lastActive}</Text>
        </View>
      </View>

      <View style={styles.infoButtonsRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowMembersModal(true)}>
          <Text style={styles.secondaryButtonText}>View members</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#3b2a4d' }]} onPress={handleLeaveGroup}>
          <Text style={styles.secondaryButtonText}>Leave group</Text>
        </TouchableOpacity>
        {!!isAdmin && (
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: '#4b2d5b' }]} onPress={() => Alert.alert('Admin', 'Admin tools will be available here soon.') }>
            <Text style={styles.secondaryButtonText}>Admin tools</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const isAdmin = !!(
    (groupDetails?.createdBy && groupDetails.createdBy === currentUserId) ||
    (groupDetails?.ownerId && groupDetails.ownerId === currentUserId) ||
    (groupDetails?.creatorId && groupDetails.creatorId === currentUserId) ||
    (Array.isArray(groupDetails?.adminIds) && groupDetails.adminIds.includes(currentUserId))
  );

  const friendlyMemberName = (m) =>
    m?.username || m?.displayName || m?.name || m?.userName || m?.id || 'Unknown';

  const resolveMemberUserId = (m) => m?.userId || m?.uid || m?.id || m?.user?.uid || m?.user?.id || null;

  const handleKickMember = (member) => {
    if (!member) return;
    Alert.alert(
      'Remove member',
      `Remove ${friendlyMemberName(member)} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const memberId = resolveMemberUserId(member);
              if (!memberId) throw new Error('Missing member id');
              const res = await kickMemberAction(groupId, memberId);
              if (res.success) {
                setMembers((prev) => prev.filter((m) => (m.userId || m.uid || m.id) !== memberId));
                Alert.alert('Member removed', 'The member was removed.');
              } else {
                Alert.alert('Failed', res.error || 'Failed to remove member');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handleBanMember = (member) => {
    if (!member) return;
    Alert.alert(
      'Ban member',
      `Ban ${friendlyMemberName(member)} from this group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              const memberId = resolveMemberUserId(member);
              if (!memberId) throw new Error('Missing member id');
              const res = await banMemberAction(groupId, memberId);
              if (res.success) {
                setMembers((prev) => prev.filter((m) => (m.userId || m.uid || m.id) !== memberId));
                Alert.alert('Member banned', 'The member was banned.');
              } else {
                Alert.alert('Failed', res.error || 'Failed to ban member');
              }
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to ban member');
            }
          }
        }
      ]
    );
  };

  const renderMembersModal = () => (
    <Modal
      transparent
      visible={showMembersModal}
      animationType="slide"
      onRequestClose={() => setShowMembersModal(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group members</Text>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowMembersModal(false)}>
              <Ionicons name="close" size={moderateScale(20)} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {members.length === 0 ? (
            <View style={{ paddingVertical: moderateScale(20) }}>
              <Text style={{ color: COLORS.lightGray }}>No members to show.</Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item, index) => String(item.userId || item.uid || item.id || index)}
              renderItem={({ item }) => (
                <View style={styles.memberRow}>
                  <Text style={styles.memberName}>{friendlyMemberName(item)}</Text>
                  {isAdmin && (item.userId || item.uid || item.id) !== currentUserId ? (
                    <View style={styles.memberActions}>
                      <TouchableOpacity style={styles.memberActionBtn} onPress={() => handleKickMember(item)}>
                        <Text style={styles.memberActionText}>Remove</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.memberActionBtn, { backgroundColor: '#5b2b2b' }]} onPress={() => handleBanMember(item)}>
                        <Text style={styles.memberActionText}>Ban</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              )}
              ItemSeparatorComponent={() => <View style={styles.memberDivider} />}
              contentContainerStyle={{ paddingBottom: moderateScale(8) }}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.white} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerCenter}
        onPress={() => setShowGroupInfo(!showGroupInfo)}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {groupDetails?.name || 'Group Chat'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {groupDetails?.memberCount} members • {groupDetails?.lastActive}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={handleLeaveGroup}
      >
        <Ionicons name="exit-outline" size={moderateScale(24)} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyMessages = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles" size={moderateScale(50)} color={COLORS.lightGray} />
      <HeightSpacer height={10} />
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Be the first to start the conversation!</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.gradientPink} />
          <Text style={styles.loadingText}>Loading group chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {renderHeader()}
        
        {showGroupInfo && renderGroupInfo()}
        {renderMembersModal()}
        
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={(item, index) => item.key || `row-${index}`}
          renderItem={renderItem}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMessages(true)}
              colors={[COLORS.gradientPink]}
              tintColor={COLORS.gradientPink}
            />
          }
          ListEmptyComponent={renderEmptyMessages}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
        />
        
        <ChatInput
          messageText={messageText}
          onChangeText={setMessageText}
          onSendPress={handleSendMessage}
          loading={sendingMessage}
          onFocus={() => {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
          }}
          onInputContentSizeChange={() => {
            requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: false }));
          }}
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: moderateScale(10),
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10),
    paddingBottom: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardDark,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: moderateScale(10),
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginTop: moderateScale(2),
  },
  headerButton: {
    padding: moderateScale(8),
  },
  groupInfoContainer: {
    backgroundColor: COLORS.cardDark,
    marginHorizontal: moderateScale(10),
    marginBottom: moderateScale(10),
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
  },
  infoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: moderateScale(10),
    gap: moderateScale(10),
  },
  secondaryButton: {
    backgroundColor: '#2c2a3b',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  groupName: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: moderateScale(5),
  },
  groupDescription: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    marginBottom: moderateScale(10),
  },
  groupStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginLeft: moderateScale(5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: moderateScale(10),
    fontSize: moderateScale(14),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.cardDark,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    padding: moderateScale(12),
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  modalClose: {
    padding: moderateScale(6),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: moderateScale(8),
  },
  memberName: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    flex: 1,
    marginRight: moderateScale(10),
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(6),
  },
  memberActionBtn: {
    backgroundColor: '#3b2a4d',
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(6),
  },
  memberActionText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  memberDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#444',
    opacity: 0.6,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    flexGrow: 1,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(10),
    paddingHorizontal: moderateScale(10),
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#444',
    opacity: 0.6,
  },
  separatorLabelContainer: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    marginHorizontal: moderateScale(8),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
  },
  separatorLabelText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  messageContainer: {
    marginVertical: moderateScale(2),
    maxWidth: '80%',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
  },
  senderName: {
    color: COLORS.gradientPink,
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: moderateScale(3),
    marginLeft: moderateScale(10),
  },
  messageBubble: {
    padding: moderateScale(12),
    borderRadius: moderateScale(16),
    minWidth: moderateScale(60),
  },
  currentUserBubble: {
    backgroundColor: COLORS.gradientPurple,
    borderBottomRightRadius: moderateScale(5),
  },
  otherUserBubble: {
    backgroundColor: COLORS.cardDark,
    borderBottomLeftRadius: moderateScale(5),
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  currentUserText: {
    color: COLORS.white,
  },
  otherUserText: {
    color: COLORS.white,
  },
  messageTime: {
    fontSize: moderateScale(11),
    marginTop: moderateScale(4),
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherUserTime: {
    color: COLORS.lightGray,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: moderateScale(8),
  },
  systemMessageText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    fontStyle: 'italic',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(50),
  },
  emptyText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginTop: moderateScale(5),
  },
});

export default GroupChatScreen; 