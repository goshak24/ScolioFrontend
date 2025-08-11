import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const PatternsRangeTabs = ({ range, onChange }) => {
  const ranges = ['week', 'month'];
  return (
    <View style={styles.container}>
      {ranges.map((r) => (
        <TouchableOpacity
          key={r}
          style={[styles.tab, range === r && styles.tabActive]}
          onPress={() => onChange(r)}
        >
          <Text style={[styles.tabText, range === r && styles.tabTextActive]}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default PatternsRangeTabs;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    marginHorizontal: moderateScale(15),
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(6),
  },
  tab: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  tabActive: {
    backgroundColor: COLORS.primaryPurple,
  },
  tabText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(13),
  },
  tabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});


