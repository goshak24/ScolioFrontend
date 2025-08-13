import React, { forwardRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import ChatMessage from './ChatMessage';
import { formatMessageDayLabel, getDayKey } from './utils';

/**
 * MessageList component to display a scrollable list of messages
 * @param {Array} messages - Array of message objects to display
 * @param {boolean} loadingMore - Whether older messages are being loaded
 * @param {boolean} hasMoreMessages - Whether there are more messages to load
 * @param {Function} onLoadMore - Function to load more messages
 * @param {Function} formatMessageTime - Function to format message timestamps
 * @param {string} userId - Current user's ID to determine message ownership
 * @param {number} lastUpdate - Timestamp of last update for re-rendering
 */
const MessageList = forwardRef(({ 
  messages, 
  loadingMore, 
  hasMoreMessages, 
  onLoadMore, 
  formatMessageTime, 
  userId,
  lastUpdate,
  onContentSizeChange,
  onLayout
}, ref) => {
  
  // Build data with day separators interleaved
  const listData = useMemo(() => {
    const result = [];
    let prevDayKey = null;
    for (let i = 0; i < (messages?.length || 0); i += 1) {
      const msg = messages[i];
      const dayKey = getDayKey(msg.timestamp);
      if (dayKey && dayKey !== prevDayKey) {
        result.push({ type: 'separator', key: `sep-${dayKey}-${i}`, label: formatMessageDayLabel(msg.timestamp) });
        prevDayKey = dayKey;
      }
      result.push({ type: 'message', key: msg.id || `msg-${i}`, data: msg });
    }
    return result;
  }, [messages]);

  // Render items (message or separator)
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

    const message = item.data;
    const isOwnMessage = message.senderId === userId;
    const messageTimestamp = formatMessageTime(message.timestamp);
    return (
      <ChatMessage
        message={message}
        isOwnMessage={isOwnMessage}
        timestamp={messageTimestamp}
      />
    );
  };
  
  // Render loading indicator for pagination (at the top)
  const renderLoadingMoreIndicator = () => {
    if (loadingMore && hasMoreMessages) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.gradientPink} />
          <Text style={styles.loadingText}>Loading older messages...</Text>
        </View>
      );
    }
    return null;
  };
  
  // Render empty state when no messages
  const renderEmptyComponent = () => (
    <View style={styles.emptyMessages}>
      <Text style={styles.emptyText}>No messages yet</Text>
      <Text style={styles.emptySubtext}>Start a conversation!</Text>
    </View>
  );

  return (
    <FlatList
      ref={ref}
      overScrollMode="always"
      bounces={true}
      showsVerticalScrollIndicator={true}
      data={listData}
      extraData={lastUpdate}
      keyExtractor={(item, index) => item.key || `row-${index}`}
      renderItem={renderItem}
      contentContainerStyle={styles.messagesContent}
      ListHeaderComponent={renderLoadingMoreIndicator}
      ListEmptyComponent={renderEmptyComponent}
      onRefresh={onLoadMore}
      refreshing={loadingMore}
      removeClippedSubviews={false}
      maxToRenderPerBatch={15}
      updateCellsBatchingPeriod={50}
      windowSize={15}
      initialNumToRender={20}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      scrollEnabled={true}
      maintainVisibleContentPosition={{ 
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10
      }}
      scrollEventThrottle={16}
    />
  );
});

const styles = StyleSheet.create({
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(10),
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  loadingMoreContainer: {
    paddingVertical: moderateScale(15),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginTop: moderateScale(5),
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(50),
  },
  emptyText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: moderateScale(5),
  },
  emptySubtext: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
});

export default MessageList;