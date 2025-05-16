import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const SurgeryInfo = ({ 
  date, 
  time, 
  hospital, 
  surgeon, 
  procedure 
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.infoTitle}>Surgery Information</Text>
      <InfoRow label="Date:" value={date} />
      <InfoRow label="Time:" value={time} />
      <InfoRow label="Hospital:" value={hospital} />
      <InfoRow label="Surgeon:" value={surgeon} />
      <InfoRow label="Procedure:" value={procedure} />
    </View>
  );
};

export default SurgeryInfo;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(15),
    borderRadius: moderateScale(12),
  },
  infoTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: moderateScale(12),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
    padding: moderateScale(5),
  },
  infoLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  infoValue: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    textAlign: 'right',
    flexShrink: 1,
  }
}); 