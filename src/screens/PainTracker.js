import { SafeAreaView, StyleSheet, Text, View, ScrollView, StatusBar, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useCallback, useEffect, useContext, useMemo } from 'react';
import { Context as PainTrackingContext } from '../context/PainTrackingContext';
import { moderateScale } from 'react-native-size-matters';
import { Ionicons } from '@expo/vector-icons';
import COLORS from '../constants/COLORS';
import HeightSpacer from '../components/reusable/HeightSpacer';
import PatternsRangeTabs from '../components/pain_tracking/PatternsRangeTabs';
import HistoryWeekStrip from '../components/pain_tracking/HistoryWeekStrip';
import HistoryActionsRow from '../components/pain_tracking/HistoryActionsRow';
import PatternsChart from '../components/pain_tracking/PatternsChart';
import BodyMapSelector from '../components/pain_tracking/BodyMapSelector';
import PainIntensitySlider from '../components/pain_tracking/PainIntensitySlider';
import TimeOfDaySelector from '../components/pain_tracking/TimeOfDaySelector';
import ActivitiesSelector from '../components/pain_tracking/ActivitiesSelector';
import SleepQualityTracker from '../components/pain_tracking/SleepQualityTracker';
import PainNotes from '../components/pain_tracking/PainNotes';
import SaveButton from '../components/pain_tracking/SaveButton';
import CalendarModal from '../components/reusable/Calendar/CalendarModal';
import { 
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachMonthOfInterval,
  isAfter,
  isWithinInterval,
  parseISO
} from 'date-fns';
import BodyMapVisualization from '../components/pain_tracking/BodyMapVisualization';
import PainHistoryEntry from '../components/pain_tracking/PainHistoryEntry';
import MetricsDisplay from '../components/pain_tracking/MetricsDisplay';
import ActivityTags from '../components/pain_tracking/ActivityTags';
import Constants from 'expo-constants'; 
import { KeyboardAvoidingView } from 'react-native';

const PainTracker = ({ navigation }) => {
  // Get pain tracking context
  const { state, savePainLog, getPainLogsByDate, loadPainLogs, dbLoadPainLogsForMonth } = useContext(PainTrackingContext);
  
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
  const [dataInitialized, setDataInitialized] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState({});
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);

  // Interactive history controls
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Pain patterns tracking week navigation 
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, -1 = previous week, etc.

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('track');

  // Pain tracker showing back or front image state 
  const [showBack, setShowBack] = useState(true);
  // Patterns state
  const [patternsRange, setPatternsRange] = useState('week'); // 'week' | 'month' | 'year'
  const [patternsAnchorDate, setPatternsAnchorDate] = useState(new Date());

  // Load all pain logs when component mounts
  useEffect(() => {
    const initializePainLogs = async () => {
      try {
        setIsLoadingHistory(true);
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // Load from local storage first
        await loadPainLogs();
        
        // Then load from database for the current month
        await dbLoadPainLogsForMonth(currentMonth);
        setLoadedMonths(prev => ({ ...prev, [currentMonth]: true }));
        
        setDataInitialized(true);
        console.log("Pain logs initialized");
      } catch (error) {
        console.error("Error initializing pain logs:", error);
        setDataInitialized(true); // Set to true even on error to prevent infinite loading
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    initializePainLogs();
  }, []);

  // Load pain logs for the selected date when data is ready or date changes
  useEffect(() => {
    if (dataInitialized && activeTab === 'history') {
      loadPainLogsForDate(currentHistoryDate);
    }
  }, [dataInitialized, activeTab, currentHistoryDate, state.painLogs]);

  // Ensure data is loaded for the selected patterns range
  useEffect(() => {
    if (activeTab !== 'patterns') return;
    const loadRangeMonths = async () => {
      try {
        setIsLoadingPatterns(true);
        let rangeStart;
        let rangeEnd;
        if (patternsRange === 'week') {
          rangeStart = startOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
          rangeEnd = endOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
        } else if (patternsRange === 'month') {
          rangeStart = startOfMonth(patternsAnchorDate);
          rangeEnd = endOfMonth(patternsAnchorDate);
        } else {
          rangeStart = startOfYear(patternsAnchorDate);
          rangeEnd = endOfYear(patternsAnchorDate);
        }

        // Build set of YYYY-MM months in range
        const monthsInRange = new Set();
        let cursor = new Date(rangeStart);
        while (cursor <= rangeEnd) {
          const yyyyMm = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
          monthsInRange.add(yyyyMm);
          cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        }

        // Determine which months actually need loading
        const toLoad = Array.from(monthsInRange).filter(m => !loadedMonths[m]);
        if (toLoad.length === 0) return;

        for (const monthKey of toLoad) {
          try {
            await dbLoadPainLogsForMonth(monthKey);
            setLoadedMonths(prev => (prev[monthKey] ? prev : { ...prev, [monthKey]: true }));
          } catch (e) {
            console.error('Error loading month for patterns', monthKey, e);
          }
        }
      } finally {
        setIsLoadingPatterns(false);
      }
    };
    loadRangeMonths();
  }, [activeTab, patternsRange, patternsAnchorDate, loadedMonths, dbLoadPainLogsForMonth]);

  // Function to load pain logs for a specific date
  const loadPainLogsForDate = (date) => {
    try {
      // Use the selector function with the current state
      const getLogsByDate = getPainLogsByDate(date);
      const logs = getLogsByDate(state);
      setHistoryLogs(logs);
      console.log(`Loaded ${logs.length} logs for date: ${date}`);
    } catch (err) {
      console.error('Error loading pain logs:', err);
      Alert.alert('Error', 'Failed to load pain history');
    }
  };

  // Navigate to previous day
  const goToPreviousDay = async () => {
    const currentDate = new Date(currentHistoryDate);
    const currentMonth = currentDate.toISOString().slice(0, 7); // Get current month (YYYY-MM)
    
    // Move to previous day
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split('T')[0];
    const newMonth = currentDate.toISOString().slice(0, 7); // Get new month after navigation
    
    // If month has changed, load data for the new month
    if (newMonth !== currentMonth) {
      console.log(`Month changed from ${currentMonth} to ${newMonth}, loading data...`);
      try {
        setIsLoadingHistory(true);
        await dbLoadPainLogsForMonth(newMonth);
      } catch (error) {
        console.error(`Error loading pain logs for month ${newMonth}:`, error);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    
    setCurrentHistoryDate(newDate);
  };

  // Navigate to next day
  const goToNextDay = async () => {
    const currentDate = new Date(currentHistoryDate);
    const currentMonth = currentDate.toISOString().slice(0, 7); // Get current month (YYYY-MM)
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split('T')[0];
    
    // Don't allow selecting future dates
    if (nextDate <= new Date().toISOString().split('T')[0]) {
      const newMonth = currentDate.toISOString().slice(0, 7); // Get new month after navigation
      
      // If month has changed, load data for the new month
      if (newMonth !== currentMonth) {
        console.log(`Month changed from ${currentMonth} to ${newMonth}, loading data...`);
        try {
          setIsLoadingHistory(true);
          await dbLoadPainLogsForMonth(newMonth);
        } catch (error) {
          console.error(`Error loading pain logs for month ${newMonth}:`, error);
        } finally {
          setIsLoadingHistory(false);
        }
      }
      
      setCurrentHistoryDate(nextDate);
    }
  };

  // Map of date -> count of logs, to show indicators
  const painLogsCountByDate = useMemo(() => {
    const counts = {};
    state.painLogs.forEach(log => {
      // Keep counts on the actual log date; we removed the selection shift so UI is consistent
      const dateKey = log.date;
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    return counts;
  }, [state.painLogs]);

  // Build events object for calendar (to visualize pain logs)
  const painEventsForCalendar = useMemo(() => {
    const events = {};
    Object.entries(painLogsCountByDate).forEach(([dateKey, count]) => {
      events[dateKey] = Array.from({ length: count }).map((_, idx) => ({
        type: 'pain',
        title: `Pain log ${idx + 1}`,
      }));
    });
    return events;
  }, [painLogsCountByDate]);

  // Select date with month-aware loading
  const selectHistoryDate = useCallback(async (jsDate) => {
    try {
      // Build date string without timezone shifting by constructing parts
      const newDateStr = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`;
      const newMonth = newDateStr.slice(0, 7);

      if (!loadedMonths[newMonth]) {
        setIsLoadingHistory(true);
        try {
          await dbLoadPainLogsForMonth(newMonth);
          setLoadedMonths(prev => ({ ...prev, [newMonth]: true }));
        } catch (error) {
          console.error(`Error loading pain logs for month ${newMonth}:`, error);
        } finally {
          setIsLoadingHistory(false);
        }
      }

      setCurrentHistoryDate(newDateStr);
      // Recompute week start using local date parts, not the jsDate ref
      const [yy,mm,dd] = newDateStr.split('-').map(n=>parseInt(n,10));
      const localDate = new Date(yy, mm-1, dd);
      setCurrentWeekStart(startOfWeek(localDate, { weekStartsOn: 1 }));
    } catch (e) {
      console.error('Failed to select date:', e);
    }
  }, [dbLoadPainLogsForMonth, loadedMonths]);

  const goToToday = useCallback(() => {
    const today = new Date();
    selectHistoryDate(today);
  }, [selectHistoryDate]);

  const goToPreviousWeek = useCallback(() => {
    const previousWeekStart = addDays(currentWeekStart, -7);
    setCurrentWeekStart(previousWeekStart);
    // If current selection is outside the new week, select the week's start
    const [y,m,d] = currentHistoryDate.split('-').map(n=>parseInt(n,10));
    const selectedDate = new Date(y, m-1, d);
    const newWeekEnd = addDays(previousWeekStart, 6);
    if (selectedDate < previousWeekStart || selectedDate > newWeekEnd) {
      selectHistoryDate(previousWeekStart);
    }
  }, [currentWeekStart, currentHistoryDate, selectHistoryDate]);

  const goToNextWeek = useCallback(() => {
    const nextWeekStart = addDays(currentWeekStart, 7);
    setCurrentWeekStart(nextWeekStart);
    const [y,m,d] = currentHistoryDate.split('-').map(n=>parseInt(n,10));
    const selectedDate = new Date(y, m-1, d);
    const newWeekEnd = addDays(nextWeekStart, 6);
    if (selectedDate < nextWeekStart || selectedDate > newWeekEnd) {
      // Try to select the latest allowed day in the upcoming week that isn't future
      const today = new Date();
      let chosenDate = null;
      for (let i = 6; i >= 0; i--) {
        const day = addDays(nextWeekStart, i);
        if (!isAfter(day, today)) {
          chosenDate = day;
          break;
        }
      }
      if (chosenDate) {
        selectHistoryDate(chosenDate);
      }
      // If all days are future, keep current selection but still allow viewing next week's strip
    }
  }, [currentWeekStart, currentHistoryDate, selectHistoryDate]);

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
          'Logged and Noted',
          "You're one step closer to managing this!",
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
            <Text style={styles.headerTitle}>Track Your Pain</Text>
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

        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
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
                    <View style={styles.sectionTitleContainer}>
                      <Text style={styles.sectionTitle}>Select Pain Areas</Text>
                      <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => setShowBack(!showBack)}
                      >
                        <Ionicons name="sync-outline" size={moderateScale(24)} color="white" />
                      </TouchableOpacity>
                    </View>
                    <BodyMapSelector 
                      selectedAreas={selectedAreas}
                      onSelectArea={handleSelectArea}
                      showBack={showBack}
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
                  {/* Interactive weekly selector and actions */}
                    <HistoryWeekStrip
                      currentWeekStart={currentWeekStart}
                      onPrevWeek={goToPreviousWeek}
                      onNextWeek={goToNextWeek}
                      currentHistoryDate={currentHistoryDate}
                      painLogsCountByDate={painLogsCountByDate}
                      onSelectDate={selectHistoryDate}
                    />
                    <HistoryActionsRow
                      onToday={goToToday}
                      onOpenCalendar={() => setIsCalendarVisible(true)}
                    />
                  
                  {(isLoadingHistory || !dataInitialized) ? (
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

              {/* Pain Intensity Over Time Chart */}
              {activeTab === 'patterns' && ( 
                <View>
                {/* Range selector */}
                <PatternsRangeTabs range={patternsRange} onChange={setPatternsRange} />

                <View style={styles.patternSection}>
                  <Text style={styles.patternSectionTitle}>Pain Intensity Over Time</Text>
                  <View style={styles.chartContainer}>
                    <View style={styles.chartYAxis}>
                      <Text style={styles.yAxisLabel}>10</Text>
                      <Text style={styles.yAxisLabel}>5</Text>
                      <Text style={styles.yAxisLabel}>0</Text>
                    </View>
                    <View style={styles.chartArea}>
                      <View style={styles.chartGrid}>
                        {/* Grid lines */}
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                        <View style={styles.gridLine} />
                      </View>
                      {/* Dynamic data visualization */}
                      <View style={styles.lineChart}>
                        {(() => {
                          // Compute displayed range
                          let rangeStart;
                          let rangeEnd;
                          if (patternsRange === 'week') {
                            rangeStart = startOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                            rangeEnd = endOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                          } else if (patternsRange === 'month') {
                            rangeStart = startOfMonth(patternsAnchorDate);
                            rangeEnd = endOfMonth(patternsAnchorDate);
                          } else {
                            rangeStart = startOfYear(patternsAnchorDate);
                            rangeEnd = endOfYear(patternsAnchorDate);
                          }

                          // Build buckets
                          let buckets = [];
                          if (patternsRange === 'year') {
                            buckets = eachMonthOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM') }));
                          } else if (patternsRange === 'month') {
                            buckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'd') }));
                          } else {
                            // Default to week
                            buckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map(d => ({ key: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }));
                          }

                          const avgByBucket = buckets.map(b => {
                            const logs = state.painLogs.filter(log => log.date === b.key);
                            if (logs.length === 0) return { ...b, avg: 0, hasData: false };
                            const sum = logs.reduce((acc, l) => acc + (l.painIntensity || 0), 0);
                            return { ...b, avg: sum / logs.length, hasData: true };
                          });

                          const points = avgByBucket.map((b, index) => {
                            if (!b.hasData) return null;
                            const count = avgByBucket.length;
                            const leftPercent = count > 0 ? ((index + 0.5) / count) * 100 : 50;
                            const bottomPercent = (b.avg / 10) * 100; // relative to chartArea height baseline (we also have grid bg)
                            return (
                              <View key={index} style={[styles.dataPoint, { left: `${leftPercent}%`, bottom: `${bottomPercent}%` }]} />
                            );
                          }).filter(Boolean);
                          return points;
                        })()}
                      </View>
                    </View>
                  </View>
                  <View style={styles.chartXAxis}>
                    {(() => {
                      if (patternsRange === 'month') {
                        const lastDay = endOfMonth(patternsAnchorDate).getDate();
                        const ticks = [0, 5, 10, 15, 20, 25, 30].filter(n => n <= lastDay);
                        return ticks.map((n, idx) => (
                          <Text key={idx} style={styles.xAxisLabel}>{String(n)}</Text>
                        ));
                      }
                      // week
                      const start = startOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                      const end = endOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                      return eachDayOfInterval({ start, end }).map((d, idx) => (
                        <Text key={idx} style={styles.xAxisLabel}>{format(d, 'EEE')}</Text>
                      ));
                    })()}
                  </View>
                </View>

                {/* Pain by Body Area - Dynamic (range-aware) */}
                <View style={styles.patternSection}>
                  <Text style={styles.patternSectionTitle}>Pain by Body Area</Text>
                  <View style={[styles.bodyAreaContainer, { backgroundColor: COLORS.workoutOption }]}>
                    {(() => {
                      // Compute selected range
                      let rangeStart;
                      let rangeEnd;
                      if (patternsRange === 'week') {
                        rangeStart = startOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                        rangeEnd = endOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                      } else if (patternsRange === 'month') {
                        rangeStart = startOfMonth(patternsAnchorDate);
                        rangeEnd = endOfMonth(patternsAnchorDate);
                      } else {
                        rangeStart = startOfYear(patternsAnchorDate);
                        rangeEnd = endOfYear(patternsAnchorDate);
                      }
                      const filteredLogs = state.painLogs.filter(log => {
                        if (!log.date) return false;
                        try {
                          const d = parseISO(log.date);
                          return isWithinInterval(d, { start: rangeStart, end: rangeEnd });
                        } catch {
                          return false;
                        }
                      });

                      const bodyPartCounts = {};
                      const totalLogs = filteredLogs.length;
                      
                      filteredLogs.forEach(log => {
                        log.bodyParts.forEach(part => {
                          bodyPartCounts[part] = (bodyPartCounts[part] || 0) + 1;
                        });
                      });
                      
                      // Convert to array and sort by frequency
                      const sortedBodyParts = Object.entries(bodyPartCounts)
                        .map(([part, count]) => ({
                          name: part.replace(/_/g, ' ').split(' ').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' '),
                          percentage: totalLogs > 0 ? Math.round((count / totalLogs) * 100) : 0,
                          count
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5); // Show top 5 body parts
                      
                      if (sortedBodyParts.length === 0) {
                        return (
                          <Text style={styles.noDataText}>No pain data available yet</Text>
                        );
                      }
                      
                      return sortedBodyParts.map((bodyPart, index) => {
                        // Color based on frequency
                        let barColor = COLORS.primaryPurple;
                        if (bodyPart.percentage >= 80) barColor = COLORS.red;
                        else if (bodyPart.percentage >= 50) barColor = COLORS.accentOrange;
                        else if (bodyPart.percentage >= 20) barColor = COLORS.primaryPurple;
                        
                        return (
                          <View key={index} style={styles.bodyAreaItem}>
                            <View style={styles.bodyAreaInfo}>
                              <Text style={styles.bodyAreaName}>{bodyPart.name}</Text>
                              <Text style={styles.bodyAreaPercentage}>{bodyPart.percentage}% of logs</Text>
                            </View>
                            <View style={styles.progressBarContainer}>
                              <View style={[
                                styles.progressBar, 
                                { 
                                  width: `${bodyPart.percentage}%`, 
                                  backgroundColor: barColor 
                                }
                              ]} />
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>

                {/* Pain Correlation with Activities - Dynamic (range-aware) */}
                <View style={styles.patternSection}>
                  <Text style={styles.patternSectionTitle}>Pain Correlation with Activities</Text>
                  <View style={[styles.activitiesContainer, { backgroundColor: COLORS.workoutOption }]}>
                    {(() => {
                      // Compute selected range
                      let rangeStart;
                      let rangeEnd;
                      if (patternsRange === 'week') {
                        rangeStart = startOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                        rangeEnd = endOfWeek(patternsAnchorDate, { weekStartsOn: 1 });
                      } else if (patternsRange === 'month') {
                        rangeStart = startOfMonth(patternsAnchorDate);
                        rangeEnd = endOfMonth(patternsAnchorDate);
                      } else {
                        rangeStart = startOfYear(patternsAnchorDate);
                        rangeEnd = endOfYear(patternsAnchorDate);
                      }

                      const filteredLogs = state.painLogs.filter(log => {
                        if (!log.date) return false;
                        try {
                          const d = parseISO(log.date);
                          return isWithinInterval(d, { start: rangeStart, end: rangeEnd });
                        } catch {
                          return false;
                        }
                      });

                      // Baseline high-pain rate across the selected range
                      const totalRangeLogs = filteredLogs.length;
                      const totalRangeHighPain = filteredLogs.filter(l => (l.painIntensity || 0) >= 7).length;
                      const baseHighPainRate = totalRangeLogs > 0 ? totalRangeHighPain / totalRangeLogs : 0;

                      // Aggregate activity stats (count, high-pain count, sum intensity)
                      const activityAnalysis = {};
                      const baselineSumIntensity = filteredLogs.reduce((acc, l) => acc + (l.painIntensity || 0), 0);
                      const baselineAvgIntensity = totalRangeLogs > 0 ? baselineSumIntensity / totalRangeLogs : 0;
                      filteredLogs.forEach(log => {
                        const intensity = log.painIntensity || 0;
                        (log.activities || []).forEach(activity => {
                          if (!activityAnalysis[activity]) {
                            activityAnalysis[activity] = { totalLogs: 0, highPainLogs: 0, sumIntensity: 0 };
                          }
                          activityAnalysis[activity].totalLogs += 1;
                          activityAnalysis[activity].sumIntensity += intensity;
                          if (intensity >= 7) {
                            activityAnalysis[activity].highPainLogs += 1;
                          }
                        });
                      });

                      // Compute delta vs baseline (percentage points)
                      const correlationData = Object.entries(activityAnalysis)
                        .map(([activity, data]) => {
                          const activityRate = data.totalLogs > 0 ? data.highPainLogs / data.totalLogs : 0;
                          const deltaPct = Math.round((activityRate - baseHighPainRate) * 100);
                          const avgIntensity = data.totalLogs > 0 ? data.sumIntensity / data.totalLogs : 0;
                          const deltaIntensity = avgIntensity - baselineAvgIntensity;
                          const sharePct = totalRangeLogs > 0 ? Math.round((data.totalLogs / totalRangeLogs) * 100) : 0;
                          return {
                            name: activity.charAt(0).toUpperCase() + activity.slice(1),
                            deltaPct,
                            avgIntensity,
                            deltaIntensity,
                            totalLogs: data.totalLogs,
                            sharePct,
                          };
                        })
                        .filter(item => item.totalLogs >= 2)
                        .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
                        .slice(0, 4);
                      
                      if (correlationData.length === 0) {
                        return (
                          <Text style={styles.noDataText}>Not enough activity data yet</Text>
                        );
                      }
                      
                      return correlationData.map((activity, index) => {
                        const isHigherRisk = activity.deltaPct > 0;
                        const isNearNeutral = Math.abs(activity.deltaPct) <= 5;
                        const dotColor = isNearNeutral ? COLORS.accentOrange : (isHigherRisk ? COLORS.red : COLORS.accentGreen);
                        const bgColor = isHigherRisk ? COLORS.red + '20' : COLORS.accentGreen + '20';
                        const textColor = isHigherRisk ? COLORS.red : COLORS.accentGreen;
                        const highPainText = activity.deltaPct === 0
                          ? 'High pain: no change vs baseline'
                          : activity.deltaPct > 0
                            ? `High pain: +${activity.deltaPct}% vs baseline`
                            : `High pain: ${Math.abs(activity.deltaPct)}% lower vs baseline`;
                        const avgText = `Avg: ${activity.avgIntensity.toFixed(1)}/10`;
                        const freqText = `${activity.totalLogs} logs${activity.sharePct ? ` • ${activity.sharePct}%` : ''}`;
                        
                        return (
                          <View key={index} style={styles.activityItem}>
                            <View style={styles.activityInfo}>
                              <View style={[styles.activityDot, { backgroundColor: dotColor }]} />
                              <Text style={styles.activityName}>{activity.name}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <View style={[styles.painChangeContainer, { backgroundColor: bgColor, marginBottom: 4 }]}>
                                <Text style={[styles.painChangeText, { color: textColor }]}>
                                  {highPainText}
                                </Text>
                              </View>
                              <View style={[styles.painChangeContainer, { backgroundColor: COLORS.backgroundPurple }]}>
                                <Text style={[styles.painChangeText, { color: COLORS.white }]}>
                                  {avgText} • {freqText}
                                </Text>
                              </View>
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>

                {/* Recommendations - Dynamic */}
                <View style={styles.patternSection}>
                  <Text style={styles.patternSectionTitle}>Recommendations</Text>
                  <View style={[styles.recommendationsContainer, { backgroundColor: COLORS.workoutOption }]}>
                    {(() => {
                      const recommendations = [];
                      
                      // Analyze pain patterns for recommendations
                      if (state.painLogs.length === 0) {
                        return (
                          <Text style={styles.noDataText}>Start tracking pain to get personalized recommendations</Text>
                        );
                      }
                      
                      // Check for high pain days
                      const highPainDays = state.painLogs.filter(log => log.painIntensity >= 7).length;
                      const totalLogs = state.painLogs.length;
                      
                      if (highPainDays / totalLogs > 0.5) {
                        recommendations.push("Consider consulting with a healthcare provider about your pain levels");
                      }
                      
                      // Check most common body parts
                      const bodyPartCounts = {};
                      state.painLogs.forEach(log => {
                        log.bodyParts.forEach(part => {
                          bodyPartCounts[part] = (bodyPartCounts[part] || 0) + 1;
                        });
                      });
                      
                      const mostCommonPart = Object.entries(bodyPartCounts)
                        .sort(([,a], [,b]) => b - a)[0];
                      
                      if (mostCommonPart && mostCommonPart[0].includes('back')) {
                        recommendations.push("Try gentle back stretches and consider ergonomic improvements");
                      }
                      
                      // Check sleep quality correlation
                      const avgSleepQuality = state.painLogs.reduce((sum, log) => sum + (log.sleepQuality || 5), 0) / totalLogs;
                      if (avgSleepQuality < 6) {
                        recommendations.push("Poor sleep may be affecting your pain - consider improving sleep hygiene");
                      }
                      
                      // Generic recommendations if not enough data
                      if (recommendations.length === 0) {
                        recommendations.push("Keep tracking your pain to identify patterns");
                        recommendations.push("Stay hydrated and maintain gentle movement throughout the day");
                      }
                      
                      return recommendations.slice(0, 3).map((rec, index) => (
                        <View key={index} style={styles.recommendationItem}>
                          <Ionicons name="checkmark-circle" size={moderateScale(20)} color={COLORS.accentGreen} />
                          <Text style={styles.recommendationText}>{rec}</Text>
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <CalendarModal 
          visible={isCalendarVisible}
          onClose={() => setIsCalendarVisible(false)}
          onDateSelect={(date) => { selectHistoryDate(date); setIsCalendarVisible(false); }}
          // Shift events internally by -1 day for alignment so modal shows markers on correct day
          events={painEventsForCalendar}
          initialDate={new Date(currentHistoryDate)}
          defaultView="month"
        />
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
  historyControlsContainer: {
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
  historyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: moderateScale(8),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundPurple,
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
  },
  actionButtonText: {
    color: COLORS.white,
    marginLeft: moderateScale(6),
    fontSize: moderateScale(12),
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
    backgroundColor: COLORS.backgroundPurple,
    padding: moderateScale(5),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(5),
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
  },
  sectionContainer: {
    paddingHorizontal: moderateScale(15),
    marginTop: moderateScale(10)
  },
  sectionTitleContainer: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(5),
    justifyContent: 'space-between',
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

  // Pattern styles
  patternSection: {
    paddingHorizontal: moderateScale(15),
    marginBottom: moderateScale(25)
  },
  patternRangeTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.cardDark,
    marginHorizontal: moderateScale(15),
    marginBottom: moderateScale(12),
    borderRadius: moderateScale(10),
    paddingVertical: moderateScale(6),
  },
  patternRangeTab: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(8),
  },
  patternRangeTabActive: {
    backgroundColor: COLORS.primaryPurple,
  },
  patternRangeTabText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(13),
  },
  patternRangeTabTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  patternSectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: moderateScale(15),
  },
  
  // Chart styles
  chartContainer: {
    flexDirection: 'row',
    height: moderateScale(150),
    backgroundColor: COLORS.workoutOption, 
    borderTopLeftRadius: moderateScale(10),
    borderTopRightRadius: moderateScale(10),
    padding: moderateScale(10),
    paddingVertical: moderateScale(12),
    marginBottom: moderateScale(10),
  },
  chartYAxis: {
    width: moderateScale(25),
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: moderateScale(10),
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
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryPurple,
    transform: [{ translateX: -4 }, { translateY: 4 }],
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
  xAxisLabel: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  
  // Body area styles
  bodyAreaContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  bodyAreaItem: {
    marginBottom: moderateScale(15),
  },
  bodyAreaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  bodyAreaName: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  bodyAreaPercentage: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
  },
  progressBarContainer: {
    height: moderateScale(8),
    backgroundColor: COLORS.darkBackground,
    borderRadius: moderateScale(4),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
  
  // Activities styles
  activitiesContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(12),
  },
  activityName: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  painChangeContainer: {
    backgroundColor: COLORS.red + '20',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(6),
  },
  painChangeText: {
    color: COLORS.red,
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  
  // Recommendations styles
  recommendationsContainer: {
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', 
    marginVertical: moderateScale(5),
  },
  recommendationText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginLeft: moderateScale(10),
    flex: 1,
    lineHeight: moderateScale(20),
  },
  noDataText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    fontStyle: 'italic',
    padding: moderateScale(20),
  },
});