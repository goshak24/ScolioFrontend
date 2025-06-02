import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import React, { useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { Ionicons } from '@expo/vector-icons';
import ReusableButton from '../../components/reusable/ReusableButton';
import { Context as PainTrackingContext } from '../../context/PainTrackingContext';

const PainTrackerSummary = () => {
  const navigation = useNavigation();
  const { state } = useContext(PainTrackingContext); 

  // Get the most recent pain log
  const getMostRecentPainLog = () => {
    if (!state.painLogs || state.painLogs.length === 0) {
      return null;
    }
    
    // Sort by createdAt timestamp (most recent first)
    const sortedLogs = [...state.painLogs].sort((a, b) => {
      const timeA = a.createdAt._seconds * 1000 + a.createdAt._nanoseconds / 1000000;
      const timeB = b.createdAt._seconds * 1000 + b.createdAt._nanoseconds / 1000000;
      return timeB - timeA;
    });
    
    return sortedLogs[0];
  };

  // Format body parts for display
  const formatBodyParts = (bodyParts) => {
    if (!bodyParts || bodyParts.length === 0) return 'No area specified';
    
    return bodyParts.map(part => {
      // Convert snake_case to readable format
      return part.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }).join(', ');
  };

  const recentPainLog = getMostRecentPainLog();
  
  // Navigate to full PainTracker screen
  const handleViewFullTracker = () => {
    navigation.navigate('PainTracker');
  };

  return (
    <View 
      style={styles.container}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Pain Tracker</Text>
          <Text style={styles.subtitle}>Track and manage your discomfort</Text>
        </View>
      </View>

      <View style={styles.bodyContainer}>
        <View style={styles.infoContainer}>
          {recentPainLog ? (
            <View style={styles.recentEntryContainer}>
              <Text style={styles.sectionTitle}>Recent Pain</Text>
              <View style={styles.entryRow}>
                <Text style={styles.entryLabel}>{formatBodyParts(recentPainLog.bodyParts)}</Text>
                <View style={styles.intensityBadge}>
                  <Text style={styles.intensityText}>{recentPainLog.painIntensity}/10</Text>
                </View>
              </View>
              <Text style={styles.entryDescription}>
                {recentPainLog.notes || 'No notes provided'}
              </Text>
              <Text style={styles.entryMeta}>
                {recentPainLog.timeOfDay} • {recentPainLog.date}
              </Text>
            </View>
          ) : (
            <View style={styles.recentEntryContainer}>
              <Text style={styles.sectionTitle}>Recent Pain</Text>
              <Text style={styles.noDataText}>No pain logs recorded yet</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Ionicons name="pulse-outline" size={moderateScale(16)} color={COLORS.accentOrange} style={styles.metricIcon} />
          <Text style={styles.metricLabel}>Overall Pain</Text>
          <View style={styles.progressContainer}>
            <View style={[
              styles.progress, 
              { width: recentPainLog ? `${(recentPainLog.painIntensity / 10) * 100}%` : '0%' }
            ]} />
          </View>
          <Text style={styles.metricValue}>
            {recentPainLog ? `${recentPainLog.painIntensity}/10` : '0/10'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Ionicons name="bed-outline" size={moderateScale(16)} color={COLORS.primaryPurple} style={styles.metricIcon} />
          <Text style={styles.metricLabel}>Sleep Quality</Text>
          <View style={styles.progressContainer}>
            <View style={[
              styles.progress, 
              { 
                width: recentPainLog ? `${(recentPainLog.sleepQuality / 10) * 100}%` : '0%',
                backgroundColor: COLORS.primaryPurple 
              }
            ]} />
          </View>
          <Text style={styles.metricValue}>
            {recentPainLog ? `${recentPainLog.sleepQuality}/10` : '0/10'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <ReusableButton 
          btnText="View Full Tracker"
          textColor={COLORS.white}
          width="100%"
          borderWidth={0}
          borderColor="transparent"
          useGradient={true}
          gradientColors={[COLORS.accentOrange, '#FF5733']}
          onPress={handleViewFullTracker}
        />
      </View>
    </View>
  );
};

export default PainTrackerSummary;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(15),
    marginHorizontal: moderateScale(10),
    marginVertical: moderateScale(10),
    padding: moderateScale(15),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: moderateScale(13),
    color: COLORS.lightGray,
    marginTop: moderateScale(2),
  },
  addButton: {
    backgroundColor: COLORS.accentOrange,
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
  },
  bodyMapContainer: {
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyOutlineContainer: {
    width: '100%',
    aspectRatio: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyOutline: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(25),
    position: 'relative',
  },
  painHighlight: {
    position: 'absolute',
    top: '25%',
    right: '0%',
    width: '50%',
    height: '15%',
    backgroundColor: COLORS.accentOrange,
    opacity: 0.7,
    borderRadius: moderateScale(5),
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  recentEntryContainer: {
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.lightGray,
    marginBottom: moderateScale(5),
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(3),
  },
  entryLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  intensityBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(10),
  },
  intensityText: {
    fontSize: moderateScale(12),
    color: COLORS.white,
    fontWeight: '500',
  },
  entryDescription: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginBottom: moderateScale(3),
  },
  entryMeta: {
    fontSize: moderateScale(11),
    color: COLORS.lightGray,
    opacity: 0.7,
  },
  noDataText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    fontStyle: 'italic',
  },
  metricsContainer: {
    flexDirection: 'row',
    marginBottom: moderateScale(15),
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(10),
    padding: moderateScale(10),
    marginHorizontal: moderateScale(3),
  },
  metricIcon: {
    marginBottom: moderateScale(5),
  },
  metricLabel: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginBottom: moderateScale(5),
  },
  progressContainer: {
    height: moderateScale(4),
    backgroundColor: '#11182730',
    borderRadius: moderateScale(2),
    marginBottom: moderateScale(5),
  },
  progress: {
    height: '100%',
    borderRadius: moderateScale(2),
    backgroundColor: COLORS.accentOrange,
  },
  metricValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  viewButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: COLORS.white,
    marginRight: moderateScale(5),
  },
});