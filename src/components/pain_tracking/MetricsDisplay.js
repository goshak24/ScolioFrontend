import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';

const MetricsDisplay = ({ metrics }) => {
  return (
    <View style={styles.container}>
      {metrics.map((metric, index) => (
        <View key={index} style={styles.metricContainer}>
          <View style={styles.metricHeader}>
            <Ionicons 
              name={metric.icon} 
              size={moderateScale(16)} 
              color={metric.color || COLORS.white}
              style={styles.icon}
            />
            <Text style={styles.metricTitle}>{metric.title}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progress, 
                { 
                  width: `${(metric.value / metric.maxValue) * 100}%`,
                  backgroundColor: metric.color || COLORS.accentOrange
                }
              ]} 
            />
          </View>
          
          <Text style={styles.valueText}>{metric.value}/{metric.maxValue}</Text>
        </View>
      ))}
    </View>
  );
};

export default MetricsDisplay;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: moderateScale(10),
    marginVertical: moderateScale(10),
  },
  metricContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    marginHorizontal: moderateScale(5),
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(10),
  },
  icon: {
    marginRight: moderateScale(5),
  },
  metricTitle: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  progressContainer: {
    height: moderateScale(6),
    backgroundColor: '#11182730',
    borderRadius: moderateScale(3),
    marginBottom: moderateScale(8),
  },
  progress: {
    height: '100%',
    borderRadius: moderateScale(3),
  },
  valueText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'right',
  },
});
