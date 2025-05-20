import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const PainHistoryEntry = ({ area, intensity, description }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.areaText}>{area}</Text>
        <View style={styles.intensityBadge}>
          {/*<Text style={styles.intensityText}>{intensity}/10</Text>*/}
        </View>
      </View>
      {/*{description && <Text style={styles.descriptionText}>{description}</Text>}*/}
    </View>
  );
};

export default PainHistoryEntry;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(5),
  },
  areaText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.white,
  },
  intensityBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(15),
  },
  intensityText: {
    fontSize: moderateScale(14),
    color: COLORS.white,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginTop: moderateScale(5),
  },
});
