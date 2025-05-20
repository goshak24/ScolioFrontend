import { SafeAreaView, StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity, Platform, Alert } from 'react-native';
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Context as PainTrackingContext } from '../context/PainTrackingContext';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/COLORS';
import HeightSpacer from '../components/reusable/HeightSpacer';
import BodyMapSelector from '../components/pain_tracking/BodyMapSelector';
import PainIntensitySlider from '../components/pain_tracking/PainIntensitySlider';
import TimeOfDaySelector from '../components/pain_tracking/TimeOfDaySelector';
import ActivitiesSelector from '../components/pain_tracking/ActivitiesSelector';
import SleepQualityTracker from '../components/pain_tracking/SleepQualityTracker';
import PainNotes from '../components/pain_tracking/PainNotes';
import SaveButton from '../components/pain_tracking/SaveButton';
import DateNavigator from '../components/pain_tracking/DateNavigator';
import BodyMapVisualization from '../components/pain_tracking/BodyMapVisualization';
import PainHistoryEntry from '../components/pain_tracking/PainHistoryEntry';
import MetricsDisplay from '../components/pain_tracking/MetricsDisplay';
import ActivityTags from '../components/pain_tracking/ActivityTags';
import Constants from 'expo-constants'; 

const PainTracker = ({ navigation }) => {
  // Get pain tracking context
  const { state, savePainLog, getPainLogsByDate, loadPainLogs } = useContext(PainTrackingContext);
  
  // State for pain tracking
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [painIntensity, setPainIntensity] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [selectedActivities, setSelectedActivities] = useState(['sitting']);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // History state
  const [currentHistoryDate, setCurrentHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load all pain logs when component mounts
  useEffect(() => {
    loadPainLogs();
    loadPainLogsForDate(currentHistoryDate);
  }, []); 
  
  // Load pain logs for the selected date
  useEffect(() => {
    if (activeTab === 'history') {
      loadPainLogsForDate(currentHistoryDate);
    }
  }, [activeTab, currentHistoryDate, state.painLogs]);

  // Function to load pain logs for a specific date
  const loadPainLogsForDate = (date) => {
    setIsLoadingHistory(true);
    try {
      // Use the selector function with the current state
      const getLogsByDate = getPainLogsByDate(date);
      const logs = getLogsByDate(state);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Error loading pain logs:', err);
      Alert.alert('Error', 'Failed to load pain history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const currentDate = new Date(currentHistoryDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setCurrentHistoryDate(currentDate.toISOString().split('T')[0]);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const currentDate = new Date(currentHistoryDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split('T')[0];
    // Don't allow selecting future dates
    if (nextDate <= new Date().toISOString().split('T')[0]) {
      setCurrentHistoryDate(nextDate);
    }
  };

  // Handler for area selection
  const handleSelectArea = (area) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter(a => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
    console.log('Selected body parts:', [...selectedAreas, area].filter(a => a !== area || !selectedAreas.includes(a)));
  };

  // Handler for activity selection
  const handleToggleActivity = (activity) => {
    if (selectedActivities.includes(activity)) {
      setSelectedActivities(selectedActivities.filter(a => a !== activity));
    } else {
      setSelectedActivities([...selectedActivities, activity]);
    }
  };

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('track');
  
  // Function to handle saving pain data using the context
  const handleSavePainData = useCallback(async () => {
    if (selectedAreas.length === 0) {
      Alert.alert(
        'Missing Information',
        'Please select at least one body part',
        [{ text: 'OK' }]
      );
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create a data object with all the pain tracking information
      const painData = {
        bodyParts: selectedAreas,
        painIntensity,
        timeOfDay,
        activities: selectedActivities,
        sleepQuality,
        notes,
      };
      
      // Log the data that would be sent to the backend
      console.log('Pain data to be saved:', painData);
      
      // Use the context to save the pain log
      const result = await savePainLog(painData);
      
      if (result.success) {
        // Show confirmation to the user
        Alert.alert(
          'Data Saved',
          `Pain data recorded for ${selectedAreas.length} body parts with intensity ${painIntensity}/10`,
          [{ text: 'OK' }]
        );
        
        // Reset form after successful save
        setSelectedAreas([]);
        setPainIntensity(5);
        setTimeOfDay('morning');
        setSelectedActivities(['sitting']);
        setSleepQuality(5);
        setNotes('');
        
        // Refresh the pain logs in history view if we're on that tab
        if (activeTab === 'history') {
          loadPainLogsForDate(currentHistoryDate);
        }
      } else {
        // Show error message
        Alert.alert(
          'Error',
          result.error || 'Failed to save pain log',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Error saving pain log:', err);
      Alert.alert(
        'Error',
        'An unexpected error occurred while saving your pain log',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  }, [selectedAreas, painIntensity, timeOfDay, selectedActivities, sleepQuality, notes, savePainLog, activeTab, currentHistoryDate]);

  return (
    <View style={styles.rootContainer}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple}  
        translucent={false} 
      />

      <SafeAreaView style={{ flex: 1, marginTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Pain Heat Map</Text>
            <Text style={styles.headerSubtitle}>Track and visualize your discomfort</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'track' && styles.activeTab]}
            onPress={() => setActiveTab('track')}
          >
            <Text style={[styles.tabText, activeTab === 'track' && styles.activeTabText]}>Track Pain</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'patterns' && styles.activeTab]}
            onPress={() => setActiveTab('patterns')}
          >
            <Text style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}>Patterns</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ backgroundColor: COLORS.darkBackground }}
          contentContainerStyle={{ paddingBottom: moderateScale(20) }}
          overScrollMode="never"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <HeightSpacer height={moderateScale(15)} />
            
            {/* Track Pain Content */}
            {activeTab === 'track' && (
              <>
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Select Pain Areas</Text>
                  <BodyMapSelector 
                    selectedAreas={selectedAreas}
                    onSelectArea={handleSelectArea}
                  />
                </View>
                
                <PainIntensitySlider 
                  intensity={painIntensity}
                  setIntensity={setPainIntensity}
                />
                
                <TimeOfDaySelector 
                  selectedTime={timeOfDay}
                  onSelectTime={setTimeOfDay}
                />
                
                <ActivitiesSelector 
                  selectedActivities={selectedActivities}
                  onToggleActivity={handleToggleActivity}
                />
                
                <SleepQualityTracker
                  sleepQuality={sleepQuality}
                  setSleepQuality={setSleepQuality}
                />
                
                <PainNotes
                  notes={notes}
                  setNotes={setNotes}
                />
                
                <SaveButton onPress={handleSavePainData} isLoading={isSaving || state.loading} />
              </>
            )}

            {/* History Content */}
            {activeTab === 'history' && (
              <>
                <DateNavigator 
                  date={currentHistoryDate}
                  onPrevious={goToPreviousDay}
                  onNext={goToNextDay}
                />
                
                {isLoadingHistory ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accentOrange} />
                    <Text style={styles.loadingText}>Loading pain history...</Text>
                  </View>
                ) : historyLogs.length === 0 ? (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="document-text-outline" size={moderateScale(50)} color={COLORS.lightGray} />
                    <Text style={styles.placeholderText}>No pain logs for this date</Text>
                  </View>
                ) : (
                  <>
                    {historyLogs.map((log, logIndex) => (
                      <View key={logIndex} style={styles.historyLogContainer}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Pain Areas</Text>
                          </View>
                          <Text style={styles.historyTimeText}>{log.timeOfDay.charAt(0).toUpperCase() + log.timeOfDay.slice(1)}</Text>
                        </View>
                        
                        {log.bodyParts.map((part, index) => (
                          <View key={index} style={styles.entryContainer}>
                            <PainHistoryEntry 
                              area={part.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              intensity={log.painIntensity}
                              description={log.notes || 'No additional notes'}
                            />
                            
                          </View>
                        ))}

                        <View style={[styles.entryContainer, { marginBottom: moderateScale(15) }]}>
                          {log.notes && <View><Text style={styles.sectionTitle}>Description: </Text>
                            <Text style={styles.descriptionText}>{log.notes}</Text></View>
                          }
                        </View>

                        <MetricsDisplay metrics={[
                          { title: 'Overall Pain', value: log.painIntensity, maxValue: 10, color: COLORS.accentOrange, icon: 'pulse-outline' },
                          { title: 'Sleep Quality', value: log.sleepQuality || 0, maxValue: 10, color: '#4287f5', icon: 'bed-outline' },
                        ]} />
                        
                        <ActivityTags activities={log.activities || []} />
                        
                      </View>
                    ))}
                  </>
                )}
              </>
            )}

            {/* Patterns Content - Placeholder */}
            {activeTab === 'patterns' && (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>Pain patterns will be displayed here</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default PainTracker;

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundPurple, 
  },
  loadingContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: moderateScale(10),
    fontSize: moderateScale(14),
  },
  historyLogContainer: {
    marginBottom: moderateScale(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.darkGray,
    paddingBottom: moderateScale(15),
  },
  historyTimeText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginHorizontal: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
  },
  backButton: {
    marginRight: moderateScale(10),
  },
  headerTextContainer: {
    flex: 1, 
    marginLeft: moderateScale(2)
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundPurple,
    paddingHorizontal: moderateScale(15),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primaryPurple,
  },
  tabText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    borderRadius: 15,
    backgroundColor: COLORS.cardDark,
    marginHorizontal: moderateScale(10),
    marginTop: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  sectionContainer: {
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(10)
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: moderateScale(10),
  },
  entryContainer: {
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(5),
  },
  submitButtonContainer: {
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(20)
  },
  submitButton: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: moderateScale(15),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: moderateScale(100),
  },
  placeholderText: {
    fontSize: moderateScale(16),
    color: COLORS.lightGray,
  },
  descriptionText: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
});