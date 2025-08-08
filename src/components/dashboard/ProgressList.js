import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const ProgressList = ({ cards = [] }) => {
  return (
    <View style={styles.cardBlock}>
      <Text style={styles.sectionHeader}>Your Progress</Text>
      {cards.map((c) => (
        <View key={c.key} style={[styles.progressCard, { backgroundColor: c.bg }] }>
          <View style={styles.progressRow}>
            <View style={[styles.quickIconWrap, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon} size={22} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: moderateScale(10) }}>
              <Text style={styles.progressTitle}>{c.title}</Text>
              <Text style={styles.progressSubtitle}>{c.subtitle}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="play" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
    marginBottom: moderateScale(8)
  },
  cardBlock: {
    marginTop: moderateScale(14)
  },
  progressCard: {
    borderRadius: moderateScale(12),
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    marginBottom: moderateScale(8)
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  quickIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTitle: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(14)
  },
  progressSubtitle: {
    color: COLORS.text,
    fontSize: moderateScale(12)
  },
});

export default ProgressList;

