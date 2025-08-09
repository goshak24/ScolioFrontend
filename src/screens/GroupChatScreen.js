import React, { useState, useContext, useEffect, useRef } from 'react';
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
  RefreshControl
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
  
  const flatListRef = useRef(null);
  
  const { 
    state: GroupsState, 
    getGroupDetails, 
    getGroupMessages, 
    sendMessage, 
    leaveGroup,
    setError,
    listenToGroupMessages 
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

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group details and messages in parallel
      const [detailsResult] = await Promise.allSettled([
        getGroupDetails(groupId),
        loadMessages()
      ]);
      
      if (detailsResult.status === 'fulfilled') {
        setGroupDetails(detailsResult.value.group);
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
      
      const messagesData = await getGroupMessages(groupId, { limit: 50 });
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

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const isSystemMessage = item.messageType === 'system';
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showSenderName = !isCurrentUser && !isSystemMessage && 
      (prevMessage?.senderId !== item.senderId || prevMessage?.messageType === 'system');

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{item.text}</Text>
        </View>
      );
    }

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {showSenderName && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
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
    </View>
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
        
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
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
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />
        
        <ChatInput
          messageText={messageText}
          onChangeText={setMessageText}
          onSendPress={handleSendMessage}
          loading={sendingMessage}
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
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(10),
    flexGrow: 1,
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