import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';
import ReusableButton from '../reusable/ReusableButton';
import { Context as GroupsContext } from '../../context/GroupsContext';

const CreateGroupModal = ({ visible, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'public',
    tags: '',
    rules: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const { createGroup } = useContext(GroupsContext);

  const visibilityOptions = [
    { key: 'public', label: 'Public', description: 'Anyone can find and join' },
    { key: 'private', label: 'Private', description: 'Invite only' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Group description is required');
      return false;
    }
    if (formData.name.length < 3) {
      Alert.alert('Error', 'Group name must be at least 3 characters');
      return false;
    }
    if (formData.description.length < 10) {
      Alert.alert('Error', 'Group description must be at least 10 characters');
      return false;
    }
    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        visibility: formData.visibility,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        rules: formData.rules.trim() || 'Be respectful and kind to all members.'
      };

      await createGroup(groupData);
      
      Alert.alert(
        'Success!', 
        'Group created successfully!',
        [{ text: 'OK', onPress: handleClose }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      visibility: 'public',
      tags: '',
      rules: ''
    });
    onClose();
  };

  const renderVisibilityOption = (option) => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.visibilityOption,
        formData.visibility === option.key && styles.selectedVisibilityOption
      ]}
      onPress={() => handleInputChange('visibility', option.key)}
      disabled={isCreating}
    >
      <View style={styles.visibilityOptionContent}>
        <View style={styles.visibilityOptionHeader}>
          <Text style={[
            styles.visibilityOptionLabel,
            formData.visibility === option.key && styles.selectedVisibilityOptionLabel
          ]}>
            {option.label}
          </Text>
          {formData.visibility === option.key && (
            <Ionicons name="checkmark-circle" size={moderateScale(20)} color={COLORS.gradientPink} />
          )}
        </View>
        <Text style={styles.visibilityOptionDescription}>
          {option.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleClose}
              disabled={isCreating}
            >
              <Ionicons name="close" size={moderateScale(24)} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Group</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <View style={styles.content}>
              {/* Group Name */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Group Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter group name"
                  placeholderTextColor={COLORS.lightGray}
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  maxLength={50}
                  editable={!isCreating}
                />
                <Text style={styles.characterCount}>{formData.name.length}/50</Text>
              </View>

              {/* Description */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe what this group is about..."
                  placeholderTextColor={COLORS.lightGray}
                  value={formData.description}
                  onChangeText={(text) => handleInputChange('description', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                  editable={!isCreating}
                />
                <Text style={styles.characterCount}>{formData.description.length}/200</Text>
              </View>

              {/* Visibility */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Visibility</Text>
                <Text style={styles.inputDescription}>
                  Choose who can find and join your group
                </Text>
                <View style={styles.visibilityContainer}>
                  {visibilityOptions.map(renderVisibilityOption)}
                </View>
              </View>

              {/* Tags */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Tags (Optional)</Text>
                <Text style={styles.inputDescription}>
                  Add tags separated by commas to help people find your group
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. fitness, motivation, beginners"
                  placeholderTextColor={COLORS.lightGray}
                  value={formData.tags}
                  onChangeText={(text) => handleInputChange('tags', text)}
                  maxLength={100}
                  editable={!isCreating}
                />
                <Text style={styles.characterCount}>{formData.tags.length}/100</Text>
              </View>

              {/* Rules */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Group Rules (Optional)</Text>
                <Text style={styles.inputDescription}>
                  Set guidelines for your group members
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Be respectful and kind to all members."
                  placeholderTextColor={COLORS.lightGray}
                  value={formData.rules}
                  onChangeText={(text) => handleInputChange('rules', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={300}
                  editable={!isCreating}
                />
                <Text style={styles.characterCount}>{formData.rules.length}/300</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <ReusableButton
              btnText="Cancel"
              fontSize={moderateScale(16)}
              height={moderateScale(50)}
              borderRadius={moderateScale(12)}
              backgroundColor={COLORS.cardDark}
              width="45%"
              onPress={handleClose}
              disabled={isCreating}
            />
            <ReusableButton
              btnText={isCreating ? "Creating..." : "Create Group"}
              fontSize={moderateScale(16)}
              height={moderateScale(50)}
              borderRadius={moderateScale(12)}
              gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
              width="45%"
              useGradient={true}
              onPress={handleCreateGroup}
              disabled={isCreating}
            />
          </View>

          {/* Loading Overlay */}
          {isCreating && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gradientPink} />
                <Text style={styles.loadingText}>Creating group...</Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardDark,
  },
  closeButton: {
    padding: moderateScale(5),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSpacer: {
    width: moderateScale(34), // Same width as close button
  },
  scrollContent: {
    flex: 1,
  },
  content: {
    padding: moderateScale(20),
  },
  inputSection: {
    marginBottom: moderateScale(20),
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  inputDescription: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
    marginBottom: moderateScale(10),
  },
  textInput: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(12),
    color: COLORS.white,
    fontSize: moderateScale(14),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: moderateScale(100),
    paddingTop: moderateScale(12),
  },
  characterCount: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    textAlign: 'right',
    marginTop: moderateScale(5),
  },
  visibilityContainer: {
    gap: moderateScale(10),
  },
  visibilityOption: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVisibilityOption: {
    borderColor: COLORS.gradientPink,
    backgroundColor: COLORS.cardDark,
  },
  visibilityOptionContent: {
    flex: 1,
  },
  visibilityOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(5),
  },
  visibilityOptionLabel: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: COLORS.white,
  },
  selectedVisibilityOptionLabel: {
    color: COLORS.white,
  },
  visibilityOptionDescription: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.cardDark,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(15),
    padding: moderateScale(25),
    alignItems: 'center',
    minWidth: moderateScale(150),
  },
  loadingText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginTop: moderateScale(10),
    fontWeight: '500',
  },
});

export default CreateGroupModal;