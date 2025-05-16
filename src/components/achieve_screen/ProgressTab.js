import { StyleSheet, Text, View } from 'react-native';
import React, { useContext } from 'react';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import COLORS from '../../constants/COLORS';
import { Context as AuthContext } from '../../context/AuthContext';

const ProgressTab = () => {
  const { state: AuthState } = useContext(AuthContext);
  const streakDays = AuthState.user.streaks;
  const activeDays = [true, true, false, false, false, false, false];

  const progressData = [
    { id: '1', label: 'Physio Sessions', value: AuthState.user.physioSessions, max: 5 },
    { id: '2', label: 'Brace Hours', value: 68, max: 112 },
    { id: '3', label: 'Pain Logs', value: 6, max: 7 },
  ];

  return (
    <View style={styles.container}>
      {/* Weekly Progress Section */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Ionicons name="calendar" size={moderateScale(18)} color={COLORS.tabActiveStart} />
          <Text style={styles.headerText}>Weekly Progress</Text>
        </View>

        {progressData.map((item) => (
          <View key={item.id} style={styles.progressItem}>
            <Text style={styles.progressLabel}>
              {item.label} <Text style={styles.progressValue}>{item.value}/{item.max}</Text>
            </Text>
            <ProgressBar progress={item.value / item.max} color={COLORS.gradientPurple} style={styles.progressBar} />
          </View>
        ))}
      </View>
    </View>
  );
};

export default ProgressTab;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: moderateScale(16),
    backgroundColor: COLORS.darkBackground,
  },
  section: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(14),
    borderRadius: moderateScale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  progressItem: {
    marginBottom: moderateScale(10),
  },
  progressLabel: {
    color: COLORS.white,
    fontSize: moderateScale(12),
  },
  progressValue: {
    color: COLORS.lightGray,
  },
  progressBar: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
  },
}); 