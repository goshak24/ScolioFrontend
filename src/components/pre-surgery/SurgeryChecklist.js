import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../reusable/HeightSpacer';
import ChecklistItem from './ChecklistItem';

const SurgeryChecklist = ({ items, onToggleItem }) => {
  // Calculate progress
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons 
          name="alert-circle-outline" 
          size={moderateScale(20)} 
          color={COLORS.accentOrange} 
          style={styles.headerIcon}
        />
        <Text style={styles.surgeryPrepTitle}>Surgery Preparation Checklist</Text>
      </View>
      
      <Text style={styles.subText}>Completed tasks</Text>

      <ProgressBar
        progress={progress}
        color={COLORS.primaryPurple}
        style={styles.progressBar}
      />

      <Text style={styles.progressCount}>{`${completedCount}/${totalCount}`}</Text>

      <HeightSpacer height={moderateScale(10)} />

      {items.map((item) => (
        <ChecklistItem 
          key={item.id} 
          item={item} 
          onToggle={onToggleItem}
        />
      ))}
    </View>
  );
};

export default SurgeryChecklist;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  headerIcon: {
    marginRight: moderateScale(8),
  },
  surgeryPrepTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  progressBar: {
    height: moderateScale(8),
    borderRadius: moderateScale(10), 
  },
  progressCount: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    alignSelf: 'flex-end',
    marginTop: moderateScale(5),
  }
}); 