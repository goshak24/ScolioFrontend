import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks,
  subWeeks, 
  addDays,
  subDays,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../../constants/COLORS';
import FullCalendarView from './FullCalendarView';
import WeeklyCalendarView from './WeeklyCalendarView';
import ModalPicker from '../ModalPicker';
import EventForm from './EventForm';
import { Context as UserContext } from '../../../context/UserContext'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const CalendarModal = ({ 
  visible, 
  onClose, 
  onDateSelect, 
  events = {},
  initialDate = new Date(),
  onEventAdd,
  onEventDelete,
  defaultView = 'month'
}) => {
  const { state: UserState, addCalendarEvent, getUserCalendarEvents, deleteCalendarEvent } = useContext(UserContext);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDateRangeOptions, setShowDateRangeOptions] = useState(false);
  const [calendarView, setCalendarView] = useState(defaultView);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [loadedMonths, setLoadedMonths] = useState({});

  const handlePrevious = () => {
    setCurrentDate(calendarView === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(calendarView === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));
  };

  const handleDateSelection = (date) => { 
    setSelectedDate(date);
    setShowAddEventForm(true);
    onDateSelect?.(date);
  };

  const handleAddEvent = () => {
    setShowAddEventForm(true);
  };

  const loadCalendarEvents = async () => { 
    if (calendarView === 'month') {
      try {
        // Get the first and last day of the month
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        
        // Format dates for API
        const formattedStartDate = format(start, 'yyyy-MM-dd');
        const formattedEndDate = format(end, 'yyyy-MM-dd');
        
        // Check if we've already loaded this month
        const monthKey = format(currentDate, 'yyyy-MM');
        if (loadedMonths[monthKey]) {
          console.log('Already loaded events for month:', monthKey);
          return;
        }
        
        // Check if we already have events for any day in this month from the user state
        const monthHasEvents = Object.keys(UserState.user?.events || {}).some(dateKey => {
          return dateKey >= formattedStartDate && dateKey <= formattedEndDate;
        });
        
        // Only fetch if we don't have events for this month yet
        if (!monthHasEvents) {
          console.log('No events found for this month, fetching from server:', formattedStartDate, 'to', formattedEndDate);
          await getUserCalendarEvents(formattedStartDate, formattedEndDate);
          // Mark this month as loaded
          setLoadedMonths(prev => ({...prev, [monthKey]: true}));
        } else {
          console.log('Using existing events for month:', formattedStartDate, 'to', formattedEndDate);
          // Mark this month as loaded since we have events
          setLoadedMonths(prev => ({...prev, [monthKey]: true}));
        }
      } catch (error) {
        if (error.response?.data?.error?.includes('requires an index')) {
          console.error('FIREBASE INDEX REQUIRED: Please create the index by visiting the link in the error message.');
          // After creating the index, you can call:
          // AsyncStorage.setItem('FIREBASE_INDEX_AVAILABLE', 'true');
        } else {
          console.error('Error loading calendar events:', error);
        }
      }
    }
  };

  useEffect(() => {
    if (visible && calendarView === 'month') {
      // Check if we've already loaded this month before calling loadCalendarEvents
      const monthKey = format(currentDate, 'yyyy-MM');
      if (!loadedMonths[monthKey]) {
        loadCalendarEvents();
      }
    }
  }, [visible, currentDate, calendarView, loadedMonths]);

  const handleSubmitEvent = (eventData) => {
    if (selectedDate) {
      if (calendarView === 'month') {
        // Only use context for general events
        addCalendarEvent?.(selectedDate, eventData);
      } else {
        // Local prop handler for physio/work week views
        onEventAdd?.(selectedDate, eventData);
      }
  
      setShowAddEventForm(false);
    }
  };  

  const handleDeleteEvent = async (date, eventIndex) => {
    if (calendarView === 'month') {
      try {
        // Subtract 1 day from the provided date to get correct date :))
        const previousDate = subDays(date, 1);
        const dateString = format(previousDate, 'yyyy-MM-dd'); 
  
        // Access events on the previous day
        const events = UserState.user?.events?.[dateString] || [];
  
        if (events.length > eventIndex) {
          const eventId = events[eventIndex].id;
          const idToken = await AsyncStorage.getItem('idToken');
          const success = await deleteCalendarEvent(idToken, eventId);
          
          if (success) {
            console.log('Event deleted successfully from previous day'); 
          }
        }
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    } else {
      onEventDelete?.(date, eventIndex);
    }
  };

  const handleCancelEvent = () => {
    setShowAddEventForm(false);
    setSelectedDate(null);
  };

  const handleViewChange = (viewType) => {
    setCalendarView(viewType.toLowerCase());
    setShowDateRangeOptions(false);
  };

  const rangeOptions = ["Month", "Week", "Work Week"]; 

  const getNavigationTitle = () => {
    if (calendarView === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else {
      const startDate = format(currentDate, 'd MMM');
      const endDate = format(addWeeks(currentDate, 1), 'd MMM yyyy');
      return `${startDate} - ${endDate}`;
    }
  };

  const renderCalendarView = () => {
    switch (calendarView) {
      case 'week':
      case 'work week':
        return (
          <WeeklyCalendarView 
            currentDate={currentDate}
            onDateSelect={handleDateSelection}
            events={events}
            selectedDate={selectedDate}
          />
        );
      case 'month':
      default:
        // Debug the events object from UserState
        console.log('Rendering month view with events:', 
          UserState.user?.events ? Object.keys(UserState.user.events).length : 0, 'date entries');
        
        return (
          <FullCalendarView 
            currentDate={currentDate}
            onDateSelect={handleDateSelection}
            events={UserState.user?.events || {}}
            selectedDate={selectedDate}
            onLoadCalendarEvents={loadCalendarEvents}
          />
        );
    }
  };

  const renderTitle = () => {
    if (calendarView === 'month') return "Health Calendar";
    if (calendarView === 'week') return "Weekly Physio Schedule";
    return "Work Week Schedule";
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={moderateScale(30)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={false}
                overScrollMode="never" 
                bounces={false}
              >
                <View style={styles.container}>
                  <View style={styles.header}>
                    <Text style={styles.title}>{renderTitle()}</Text>

                    {calendarView === 'month' && (
                      <View style={styles.navigationRow}>
                        <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
                          <Ionicons name="chevron-back" size={20} color={COLORS.white} />
                          <Text style={styles.navButtonText}>Previous</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.monthDisplay}
                          onPress={() => setShowDateRangeOptions(true)}
                        >
                          <Text style={styles.monthText}>{getNavigationTitle()}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                          <Text style={styles.navButtonText}>Next</Text>
                          <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  <View style={styles.contentContainer}>
                    {renderCalendarView()}
                  </View>

                  {showAddEventForm && selectedDate && (
                    <EventForm 
                      selectedDate={selectedDate}
                      onSubmit={handleSubmitEvent}
                      onCancel={handleCancelEvent}
                      events={calendarView === 'month' ? UserState.user?.events : events}
                      onDeleteEvent={calendarView === 'month' ? handleDeleteEvent : handleDeleteEvent}
                      calendarView={calendarView}
                    />
                  )}
                  {selectedDate && !showAddEventForm && (
                    <TouchableOpacity style={styles.addEventButton} onPress={handleAddEvent}>
                      <Ionicons name="add-circle" size={20} color={COLORS.white} />
                      <Text style={styles.addEventText}>
                        {calendarView === 'month' ? 'Add Event' : 'Add Physio Session'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <ModalPicker
        visible={showDateRangeOptions && calendarView === 'month'}
        options={rangeOptions}
        onClose={() => setShowDateRangeOptions(false)}
        onSelect={handleViewChange}
        title="Select Calendar View"
      />
    </>
  );
};

export default CalendarModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  scrollContentContainer: {
    paddingBottom: moderateScale(20),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    padding: moderateScale(15),
  },
  contentContainer: {
    marginBottom: moderateScale(15),
  },
  header: {
    marginBottom: moderateScale(15),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(10),
    textAlign: 'center',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginHorizontal: moderateScale(5),
  },
  monthDisplay: {
    padding: moderateScale(10),
  },
  monthText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
  },
  addEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(161, 48, 211, 0.8)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
  },
  addEventText: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginLeft: moderateScale(6),
  },
});