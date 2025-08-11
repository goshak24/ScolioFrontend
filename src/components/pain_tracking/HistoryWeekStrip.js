import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { format, addDays, subDays, startOfWeek, endOfWeek, isAfter } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const HistoryWeekStrip = ({
  currentWeekStart,
  onPrevWeek,
  onNextWeek,
  currentHistoryDate,
  painLogsCountByDate,
  onSelectDate,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.weekNavRow}>
        <TouchableOpacity style={styles.weekNavButton} onPress={onPrevWeek}>
          <Ionicons name="chevron-back" size={moderateScale(18)} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.weekRangeText}>
          {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
        </Text>
        <TouchableOpacity style={styles.weekNavButton} onPress={onNextWeek}>
          <Ionicons name="chevron-forward" size={moderateScale(18)} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekStrip}>
        {Array.from({ length: 7 }).map((_, index) => {
          const dayDate = addDays(currentWeekStart, index);
          const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
          const isSelected = dateStr === currentHistoryDate;
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          const isFuture = dateStr > todayStr;
          const logCount = painLogsCountByDate[dateStr] || 0;
          return (
            <TouchableOpacity
              key={index}
              disabled={isFuture}
              onPress={() => onSelectDate(dayDate)}
              style={[styles.dayPill, isSelected && styles.dayPillSelected, isFuture && styles.dayPillDisabled]}
            >
              <Text style={[styles.dayPillWeekday, isSelected && styles.dayPillSelectedText]}>
                {format(dayDate, 'EEE')}
              </Text>
              <Text style={[styles.dayPillDay, isSelected && styles.dayPillSelectedText]}>
                {format(dayDate, 'd')}
              </Text>
              {logCount > 0 && (
                <View style={styles.logDot}>
                  <Text style={styles.logDotText}>{logCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default HistoryWeekStrip;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(8),
  },
  weekNavButton: {
    backgroundColor: COLORS.backgroundPurple,
    padding: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  weekRangeText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    width: `${100 / 7 - 1}%`,
    alignItems: 'center',
    paddingVertical: moderateScale(6),
    backgroundColor: COLORS.workoutOption,
    borderRadius: moderateScale(8),
  },
  dayPillSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryPurple,
  },
  dayPillDisabled: {
    opacity: 0.4,
  },
  dayPillWeekday: {
    color: COLORS.lightGray,
    fontSize: moderateScale(11),
    marginBottom: moderateScale(2),
  },
  dayPillDay: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  dayPillSelectedText: {
    color: COLORS.primaryPurple,
  },
  logDot: {
    marginTop: moderateScale(4),
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(1),
    backgroundColor: COLORS.accentOrange + '33',
    borderRadius: moderateScale(10),
  },
  logDotText: {
    color: COLORS.accentOrange,
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
});


