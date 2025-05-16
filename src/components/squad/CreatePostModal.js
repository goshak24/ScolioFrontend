import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TextInput
} from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/COLORS';

const CreatePostModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  initialValues = {
    title: '',
    content: '',
    tags: []
  }
}) => {
  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(initialValues.tags);
  const [activeTab, setActiveTab] = useState('content'); // 'content' or 'preview'

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleSubmit = () => {
    if (title.trim() && content.trim()) {
      onSubmit({
        title: title.trim(),
        content: content.trim(),
        tags: tags
      });
      
      // Reset form
      setTitle('');
      setContent('');
      setTags([]);
      onClose();
    }
  };

  const renderTags = () => {
    return (
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.tagChip}
            onPress={() => handleRemoveTag(index)}
          >
            <Text style={styles.tagText}>{tag}</Text>
            <Ionicons name="close-circle" size={16} color={COLORS.white} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPreview = () => {
    return (
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>{title || 'Untitled Post'}</Text>
        
        <View style={styles.previewTagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.previewTagChip}>
              <Text style={styles.previewTagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.previewContent}>
          {content || 'No content yet...'}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={moderateScale(30)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Thread</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'content' && styles.activeTab
                ]}
                onPress={() => setActiveTab('content')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    activeTab === 'content' && styles.activeTabText
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.tab, 
                  activeTab === 'preview' && styles.activeTab
                ]}
                onPress={() => setActiveTab('preview')}
              >
                <Text 
                  style={[
                    styles.tabText, 
                    activeTab === 'preview' && styles.activeTabText
                  ]}
                >
                  Preview
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={styles.scrollContentContainer}
              showsVerticalScrollIndicator={false}
              overScrollMode="never" 
              bounces={false}
            >
              {activeTab === 'content' ? (
                <View style={styles.formContainer}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.titleInput}
                    placeholder="What's your thread about?"
                    placeholderTextColor={COLORS.lightGray}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />
                  
                  <Text style={styles.inputLabel}>Content</Text>
                  <TextInput
                    style={styles.contentInput}
                    placeholder="Share your thoughts, ask questions, or discuss ideas..."
                    placeholderTextColor={COLORS.lightGray}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                  />
                  
                  <Text style={styles.inputLabel}>Tags</Text>
                  <View style={styles.tagInputContainer}>
                    <TextInput
                      style={styles.tagInput}
                      placeholder="Add tags (press enter or + button)"
                      placeholderTextColor={COLORS.lightGray}
                      value={tagInput}
                      onChangeText={setTagInput}
                      onSubmitEditing={handleAddTag}
                    />
                    <TouchableOpacity 
                      style={styles.addTagButton}
                      onPress={handleAddTag}
                    >
                      <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                  
                  {renderTags()}
                </View>
              ) : (
                renderPreview()
              )}
            </ScrollView>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (!title.trim() || !content.trim()) && styles.disabledButton
                ]}
                onPress={handleSubmit}
                disabled={!title.trim() || !content.trim()}
              >
                <Text style={styles.submitButtonText}>Post Thread</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default CreatePostModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: moderateScale(12),
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gradientPurple,
  },
  tabText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  scrollContentContainer: {
    padding: moderateScale(15),
  },
  formContainer: {
    gap: moderateScale(10),
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginTop: moderateScale(5),
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    color: COLORS.white,
    fontSize: moderateScale(16),
  },
  contentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    color: COLORS.white,
    fontSize: moderateScale(14),
    minHeight: moderateScale(150),
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
    padding: moderateScale(12),
    color: COLORS.white,
  },
  addTagButton: {
    backgroundColor: COLORS.gradientPurple,
    borderTopRightRadius: moderateScale(8),
    borderBottomRightRadius: moderateScale(8),
    padding: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: moderateScale(10),
    gap: moderateScale(8),
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPurple,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
    gap: moderateScale(5),
  },
  tagText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: moderateScale(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: moderateScale(10),
  },
  cancelButton: {
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  submitButton: {
    backgroundColor: COLORS.gradientPurple,
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    minWidth: moderateScale(100),
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  previewContainer: {
    padding: moderateScale(10),
  },
  previewTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(12),
  },
  previewTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: moderateScale(15),
    gap: moderateScale(8),
  },
  previewTagChip: {
    backgroundColor: COLORS.backgroundPurple,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(12),
  },
  previewTagText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
  },
  previewContent: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
  }
});