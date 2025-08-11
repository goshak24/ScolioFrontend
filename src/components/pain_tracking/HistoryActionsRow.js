import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const HistoryActionsRow = ({ onToday, onOpenCalendar }) => {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.actionButton} onPress={onToday}>
        <Ionicons name="today-outline" size={moderateScale(16)} color={COLORS.white} />
        <Text style={styles.actionButtonText}>Today</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={onOpenCalendar}>
        <Ionicons name="calendar-outline" size={moderateScale(16)} color={COLORS.white} />
        <Text style={styles.actionButtonText}>Jump to date</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HistoryActionsRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: moderateScale(8),
    paddingHorizontal: moderateScale(15),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPurple,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: moderateScale(6),
    fontSize: moderateScale(12),
  },
});


