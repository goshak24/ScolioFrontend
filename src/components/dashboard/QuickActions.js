import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const QuickActions = ({ actions = [], onActionPress = () => {} }) => {
  return (
    <View>
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.quickGrid}>
        {actions.map((card) => (
          <View key={card.id} style={styles.quickCard}>
            <View style={[styles.quickIconWrap, { backgroundColor: card.bg }]}>
              <Ionicons name={card.icon} size={20} color={COLORS.white} />
            </View>
            <Text style={styles.quickTitle}>{card.title}</Text>
            <Text style={styles.quickSubtitle}>{card.subtitle}</Text>
            <TouchableOpacity style={styles.quickButton} onPress={() => onActionPress(card.id)}>
              <Text style={styles.quickButtonText}>{card.action}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
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
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickCard: {
    width: '48.5%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: moderateScale(10)
  },
  quickIconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(8)
  },
  quickTitle: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(13)
  },
  quickSubtitle: {
    color: COLORS.text,
    fontSize: moderateScale(11),
    marginBottom: moderateScale(8)
  },
  quickButton: {
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(8),
    paddingVertical: moderateScale(8),
    alignItems: 'center'
  },
  quickButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
    fontWeight: '600'
  },
});

export default QuickActions;

