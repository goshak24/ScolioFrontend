import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

// Dumb presentational container for the chart scaffolding
const PatternsChart = ({ yMax = 10, children, xAxis }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>Pain Intensity Over Time</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chartYAxis}>
          {[yMax, yMax * 0.75, yMax * 0.5, yMax * 0.25, 0].map((val, idx) => (
            <Text key={idx} style={styles.yAxisLabel}>
              {Number.isInteger(val) ? val : val.toFixed(1)}
            </Text>
          ))}
        </View>
        <View style={styles.chartArea}>
          <View style={styles.chartGrid}>
            {[0,1,2,3,4].map((_, i) => (
              <View key={i} style={styles.gridLine} />
            ))}
          </View>
          <View style={styles.lineChart}>{children}</View>
        </View>
      </View>
      <View style={styles.chartXAxis}>
        {xAxis}
      </View>
    </View>
  );
};

export default PatternsChart;

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(25),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: moderateScale(15),
  },
  chartContainer: {
    flexDirection: 'row',
    height: moderateScale(160),
    backgroundColor: COLORS.workoutOption,
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  chartYAxis: {
    width: moderateScale(32),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: moderateScale(8),
  },
  yAxisLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: COLORS.lightGray + '30',
  },
  lineChart: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  chartXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: moderateScale(10),
    paddingBottom: moderateScale(7.5),
    backgroundColor: COLORS.workoutOption,
    marginTop: -moderateScale(10),
    borderBottomLeftRadius: moderateScale(10),
    borderBottomRightRadius: moderateScale(10),
  },
});


