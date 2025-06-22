import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const ReusableSearchBar = ({ 
  placeholder = "Search...",
  value,
  onChangeText,
  onClear,
  style,
  inputStyle,
  containerStyle,
  showClearButton = true,
  iconName = "search",
  iconSize = moderateScale(20),
  iconColor = COLORS.lightGray,
  autoCapitalize = "none",
  autoCorrect = false,
  ...props
}) => {
  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <View style={[styles.searchContainer, containerStyle, style]}>
      <Ionicons 
        name={iconName} 
        size={iconSize} 
        color={iconColor} 
      />
      <TextInput
        style={[styles.searchInput, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.lightGray}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        {...props}
      />
      {showClearButton && value && value.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <Ionicons 
            name="close-circle" 
            size={moderateScale(20)} 
            color={COLORS.lightGray} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ReusableSearchBar;

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