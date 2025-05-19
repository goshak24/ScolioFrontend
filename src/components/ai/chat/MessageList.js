import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import ChatMessage from './ChatMessage';

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
  
  // Render individual message
  const renderMessageItem = ({ item }) => {
    // Determine if message is from current user
    const isOwnMessage = item.senderId === userId;
    
    // Format the timestamp
    const messageTimestamp = formatMessageTime(item.timestamp);
    
    return (
      <ChatMessage 
        message={item} 
        isOwnMessage={isOwnMessage} 
        timestamp={messageTimestamp} 
      />
    );
  };
  
  // Render loading indicator for pagination
  const renderLoadingMoreIndicator = () => {
    if (loadingMore && hasMoreMessages) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.gradientPink} />
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
      overScrollMode="never"
      bounces={true}
      showsVerticalScrollIndicator={false}
      data={messages}
      extraData={lastUpdate}
      keyExtractor={(item, index) => 
        item.id ? `${item.id}-${item.status || 'unknown'}-${lastUpdate}` : `msg-${index}-${Date.now()}`
      }
      renderItem={renderMessageItem}
      contentContainerStyle={styles.messagesContent}
      ListHeaderComponent={renderLoadingMoreIndicator}
      ListEmptyComponent={renderEmptyComponent}
      onEndReachedThreshold={0.1}
      onRefresh={onLoadMore}
      refreshing={loadingMore}
      removeClippedSubviews={false}
      maxToRenderPerBatch={15}
      updateCellsBatchingPeriod={50}
      windowSize={15}
      initialNumToRender={20}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
    />
  );
});

const styles = StyleSheet.create({
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
  },
  loadingMoreContainer: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
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
