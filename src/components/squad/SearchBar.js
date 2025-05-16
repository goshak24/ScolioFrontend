import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const SearchBar = ({ posts, onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (text) => {
    setSearchTerm(text);
    
    if (!text.trim()) {
      // If search is empty, return all posts
      onSearchResults(posts);
      return;
    }

    const lowerCaseSearch = text.toLowerCase();
    
    // Filter posts based on title or tags
    const filteredPosts = posts.filter(post => {
      // Check if title contains search term
      if (post.title && post.title.toLowerCase().includes(lowerCaseSearch)) {
        return true;
      }
      
      // Check if any tags contain search term
      if (post.tags && post.tags.length > 0) {
        return post.tags.some(tag => 
          tag.toLowerCase().includes(lowerCaseSearch)
        );
      }
      
      return false;
    });
    
    onSearchResults(filteredPosts);
  };

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={moderateScale(20)} color={COLORS.lightGray} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search conversations..."
        placeholderTextColor={COLORS.lightGray}
        value={searchTerm}
        onChangeText={handleSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchTerm ? (
        <Ionicons 
          name="close-circle" 
          size={moderateScale(20)} 
          color={COLORS.lightGray} 
          onPress={() => {
            setSearchTerm('');
            onSearchResults(posts);
          }}
        />
      ) : null}
    </View>
  );
};

export default SearchBar;

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  searchInput: {
    flex: 1,
    marginLeft: moderateScale(10),
    color: COLORS.white,
  },
});
