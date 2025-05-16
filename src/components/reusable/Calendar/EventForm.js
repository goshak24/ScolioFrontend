import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { format, addDays } from 'date-fns';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import Ionicons from '@expo/vector-icons/Ionicons';

const EventForm = ({ 
    selectedDate, 
    onSubmit, 
    onCancel,
    events = {},
    onDeleteEvent,
    calendarView // Add calendarView prop to determine the form behavior
  }) => {
    const [eventName, setEventName] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [eventType, setEventType] = useState('general'); // Default to general for full calendar
    const [showAddForm, setShowAddForm] = useState(false);
  
    // Create a consistent date formatting function
    const formatDateForKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    // Get events for the selected date using consistent formatting
    const dateStr = selectedDate ? formatDateForKey(selectedDate) : '';
    const dateEvents = dateStr ? (events[dateStr] || []) : []; 
  
    const handleSubmit = () => {
      // Make time optional for general events in full calendar view
      if (calendarView !== 'month' && !validateTime(eventTime)) {
        Alert.alert("Invalid Time", "Please use MM:SS format (e.g. 08:30)");
        return;
      }
      
      const newEvent = {
        title: eventName,
        time: eventTime || null, // Allow empty time for general events
        type: calendarView === 'month' ? eventType : 'physio' // Use 'physio' for weekly view
      };
      
      onSubmit(newEvent);
      
      setEventName('');
      setEventTime('');
      setShowAddForm(false);
    };
    
    const validateTime = (time) => {
      if (!time) return false;
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      return timeRegex.test(time);
    };

  const handleCancel = () => {
    // Clear form and notify parent
    setEventName('');
    setEventTime('');
    setShowAddForm(false);
    if (dateEvents.length === 0) {
      onCancel();
    }
  };

  const handleDelete = (index) => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            if (onDeleteEvent) {
              // Pass the original selectedDate without adjustment
              console.log(selectedDate)
              onDeleteEvent(addDays(selectedDate, 1), index); // temporary fix add 1 to deletion "selectedDate" day 
            }
          }
        }
      ]
    );
  };

  // Render each event item without using FlatList
  const renderEventItems = () => {
    return dateEvents.map((item, index) => (
      <View key={index} style={styles.eventItem}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          {item.time && <Text style={styles.eventTime}>{item.time}</Text>}
          <View style={[
            styles.eventTypeBadge, 
            item.type === 'brace' ? styles.braceTypeBadge : 
            item.type === 'physio' ? styles.physioTypeBadge : 
            styles.generalTypeBadge
          ]}>
            <Text style={styles.eventTypeText}>{item.type}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDelete(index)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    ));
  };

  // Determine labels based on calendar view
  const getEventNameLabel = () => calendarView === 'month' ? 'Event Title:' : 'Workout Name:';
  const getTimeLabel = () => calendarView === 'month' ? 'Time (optional):' : 'Time (MM:SS):';
  const getAddButtonText = () => calendarView === 'month' ? 'Add New Event' : 'Add New Physio Session';
  const getFormTitle = () => calendarView === 'month' ? 'Add New Event' : 'Add New Physio Session';

  return (
    <View style={styles.eventFormContainer}>
        <Text style={styles.eventFormTitle}>
            {format(selectedDate, 'MMMM d, yyyy')}
        </Text>
        
        {dateEvents.length > 0 ? (
            <>
            <Text style={styles.sectionTitle}>Scheduled Events</Text>
            <View style={styles.eventsContainer}>
                {renderEventItems()}
            </View>
            </>
        ) : (
            <Text style={styles.noEventsText}>No events scheduled for this day</Text>
        )}

        {showAddForm ? (
            <>
            <View style={styles.formDivider} />
            <Text style={styles.sectionTitle}>{getFormTitle()}</Text>
            
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{getEventNameLabel()}</Text>
                <TextInput
                style={styles.input}
                placeholder={calendarView === 'month' ? "Enter event title" : "Enter workout name"}
                placeholderTextColor={COLORS.lightGray}
                value={eventName}
                onChangeText={setEventName}
                />
            </View>
            
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{getTimeLabel()}</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g. 08:30"
                placeholderTextColor={COLORS.lightGray}
                value={eventTime}
                onChangeText={setEventTime}
                keyboardType="numbers-and-punctuation"
                />
            </View>
            
            <View style={styles.formButtonsContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                style={[
                    styles.submitButton,
                    // Make time optional for general events in calendar view
                    (!eventName || (calendarView !== 'month' && !eventTime)) && styles.disabledButton
                ]} 
                onPress={handleSubmit}
                disabled={!eventName || (calendarView !== 'month' && !eventTime)}
                >
                <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
            </View>
            </>
        ) : (
            <TouchableOpacity 
            style={styles.addNewButton}
            onPress={() => setShowAddForm(true)}
            >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.addNewButtonText}>{getAddButtonText()}</Text>
            </TouchableOpacity>
        )}
        
        {(!showAddForm || dateEvents.length > 0) && (
            <TouchableOpacity 
            style={styles.closeButton}
            onPress={onCancel}
            >
            <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        )}
    </View>
  );
};

export default EventForm;

const styles = StyleSheet.create({
  eventFormContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: moderateScale(10),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: moderateScale(20),
  },  
  eventFormTitle: {
    color: COLORS.white,
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: moderateScale(15),
    textAlign: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: moderateScale(10),
  },
  noEventsText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    textAlign: 'center',
    padding: moderateScale(10),
  },
  formDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: moderateScale(15),
  },
  inputContainer: {
    marginBottom: moderateScale(12),
  },
  inputLabel: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  input: {
    backgroundColor: COLORS.cardDark,
    color: COLORS.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    fontSize: moderateScale(14),
  },
  formButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(15),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginRight: moderateScale(8),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  submitButton: {
    flex: 1,
    backgroundColor: 'rgba(161, 48, 211, 0.8)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginLeft: moderateScale(8),
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(161, 48, 211, 0.3)',
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  addNewButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(161, 48, 211, 0.8)',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: moderateScale(8),
  },
  closeButton: {
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginTop: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  eventsContainer: {
    // no max height for now 
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: moderateScale(8),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  eventTime: {
    color: COLORS.lightGray,
    fontSize: moderateScale(12),
    marginTop: moderateScale(4),
  },
  eventTypeBadge: {
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(2),
    borderRadius: moderateScale(4),
    alignSelf: 'flex-start',
    marginTop: moderateScale(4),
  },
  physioTypeBadge: {
    backgroundColor: 'rgba(161, 48, 211, 0.5)',
  },
  braceTypeBadge: {
    backgroundColor: 'rgba(48, 161, 211, 0.5)',
  },
  generalTypeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  eventTypeText: {
    color: COLORS.white,
    fontSize: moderateScale(10),
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'rgba(211, 48, 48, 0.5)',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
  },
});