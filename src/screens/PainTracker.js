import { SafeAreaView, StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import React, { useState } from 'react';
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
  // State for pain tracking
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [painIntensity, setPainIntensity] = useState(5);
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [selectedActivities, setSelectedActivities] = useState(['sitting']);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [notes, setNotes] = useState('');

  // History state
  const [currentHistoryDate, setCurrentHistoryDate] = useState('2023-05-19');
  const [historyTimeOfDay, setHistoryTimeOfDay] = useState('Afternoon');

  // Mock data for history view
  const mockPainAreas = [
    { id: 'upper_back_right', name: 'Upper Back (Right)', intensity: 3, description: 'Much better' },
    { id: 'shoulder_right', name: 'Right Shoulder', intensity: 5, description: 'New pain after carrying backpack' },
  ];

  const mockActivities = ['School', 'Carrying heavy bag', 'Sitting'];
  
  const mockMetrics = [
    { title: 'Overall Pain', value: 4, maxValue: 10, color: COLORS.accentOrange, icon: 'pulse-outline' },
    { title: 'Sleep Quality', value: 7, maxValue: 10, color: '#4287f5', icon: 'bed-outline' },
  ];

  // Handler for area selection
  const handleSelectArea = (area) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter(a => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
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
                
                <SaveButton onPress={() => console.log('Pain log saved')}/>
              </>
            )}

            {/* History Content */}
            {activeTab === 'history' && (
              <>
                <DateNavigator 
                  date={currentHistoryDate}
                  timeOfDay={historyTimeOfDay}
                  onPrevious={() => console.log('Previous day')}
                  onNext={() => console.log('Next day')}
                />
                
                <BodyMapVisualization painAreas={mockPainAreas.map(area => ({ id: area.id, intensity: area.intensity }))} />
                
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Pain Areas</Text>
                </View>
                
                {mockPainAreas.map((area, index) => (
                  <View key={index} style={styles.entryContainer}>
                    <PainHistoryEntry 
                      area={area.name}
                      intensity={area.intensity}
                      description={area.description}
                    />
                  </View>
                ))}
                
                <MetricsDisplay metrics={mockMetrics} />
                
                <ActivityTags activities={mockActivities} />
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
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    backgroundColor: COLORS.cardDark,
    marginHorizontal: moderateScale(10),
    marginTop: moderateScale(15),
    paddingBottom: moderateScale(20),
  },
  sectionContainer: {
    paddingHorizontal: moderateScale(15),
    marginVertical: moderateScale(10),
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
});