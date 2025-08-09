import React, { useContext, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Context as UserContext } from '../../context/UserContext';

const PhysioHistoryModal = ({ visible, onClose }) => {
  const { state: { user } } = useContext(UserContext);

  const historyByDate = useMemo(() => {
    const workoutHistory = user?.treatmentData?.physio?.workoutHistory || {};
    // Build an ordered date array desc
    const dates = Object.keys(workoutHistory).sort((a, b) => b.localeCompare(a));
    return dates.map(date => ({
      date,
      workouts: Array.isArray(workoutHistory[date]) ? workoutHistory[date] : []
    }));
  }, [user]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={!!visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Recent Workouts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {historyByDate.length === 0 ? (
              <Text style={styles.emptyText}>No recent workouts found.</Text>
            ) : (
              historyByDate.map(({ date, workouts }) => (
                <View key={date} style={styles.dateBlock}>
                  <Text style={styles.dateText}>{date}</Text>
                  <View style={styles.card}>
                    {workouts.length === 0 ? (
                      <Text style={styles.itemEmpty}>No workouts</Text>
                    ) : (
                      workouts.map((name, idx) => (
                        <View key={`${date}-${idx}`} style={styles.itemRow}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.itemText}>{name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PhysioHistoryModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    backgroundColor: COLORS.darkBackground,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(12),
    paddingBottom: moderateScale(18),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  closeBtn: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(10),
    backgroundColor: COLORS.gradientPurple,
    borderRadius: moderateScale(8),
  },
  closeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: moderateScale(12),
  },
  content: {
    paddingBottom: moderateScale(10),
  },
  dateBlock: {
    marginBottom: moderateScale(10),
  },
  dateText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: moderateScale(14),
    marginBottom: moderateScale(6),
  },
  card: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: moderateScale(4),
  },
  bullet: {
    color: COLORS.accentGreen,
    marginRight: moderateScale(8),
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  itemText: {
    color: COLORS.white,
    fontSize: moderateScale(13),
    flex: 1,
  },
  itemEmpty: {
    color: COLORS.lightGray,
    fontStyle: 'italic',
    fontSize: moderateScale(12),
  },
  emptyText: {
    color: COLORS.lightGray,
    textAlign: 'center',
    paddingVertical: moderateScale(20),
  },
});

