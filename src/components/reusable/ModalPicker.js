import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const ModalPicker = ({ 
  visible, 
  options, 
  onClose, 
  onSelect, 
  title = "Select an option" 
}) => {
  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={styles.option}
      onPress={() => onSelect(item.toLowerCase ? item.toLowerCase() : item)}
    >
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade" 
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={options}
            renderItem={renderOption}
            keyExtractor={(item, index) => index.toString()}
            style={styles.list}
          />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ModalPicker; 

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    maxHeight: '60%',
  },
  title: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: moderateScale(15),
    textAlign: 'center',
  },
  list: {
    marginBottom: moderateScale(15),
  },
  option: {
    paddingVertical: moderateScale(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.gradientPurple,
    padding: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});