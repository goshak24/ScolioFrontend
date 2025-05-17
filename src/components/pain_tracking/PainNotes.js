import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const PainNotes = ({ notes, setNotes }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        multiline={true}
        numberOfLines={5}
        placeholder="Describe your pain or discomfort..."
        placeholderTextColor={COLORS.lightGray}
        value={notes}
        onChangeText={setNotes}
      />
    </View>
  );
};

export default PainNotes;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(15),
  },
  label: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: COLORS.white,
    marginBottom: moderateScale(10),
  },
  input: {
    backgroundColor: '#1F2937', // Darker input background
    borderRadius: moderateScale(12),
    color: COLORS.white,
    padding: moderateScale(15),
    fontSize: moderateScale(14),
    minHeight: moderateScale(100),
    textAlignVertical: 'top'
  }
});
