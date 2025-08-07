import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import React, { useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import { format } from 'date-fns';
import ReusableButton from './ReusableButton';
import COLORS from '../../constants/COLORS';
import HeightSpacer from './HeightSpacer';
import ModalPicker from './ModalPicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarModal from './Calendar/CalendarModal';
import FullCalendarView from './Calendar/FullCalendarView';

const treatmentOptions = ['Brace', 'Physio', 'Brace + Physio', 'Pre-Surgery', 'Post-Surgery'];

const ReusableForm = ({
  fields = [],
  onSubmit = () => {},
  buttonText = 'Submit',
  showCalendar = false,
  scheduledEvents = {},
  onEventAdd = () => {},
  onDateSelect = () => {},
  initialDate = new Date(),
  loading = false,
}) => {
  const [formData, setFormData] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [activeField, setActiveField] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // New state for the date picker modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Date picker functions moved from SignUp2.js
  const openDatePicker = (fieldName) => {
    setCurrentDateField(fieldName);
    let initialDateValue = new Date();
    if (formData[fieldName]) {
      try {
        const dateStr = formData[fieldName];
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          initialDateValue = new Date(`${month}/${day}/${year}`);
        } else {
          initialDateValue = new Date(dateStr);
        }
        if (isNaN(initialDateValue.getTime())) {
          initialDateValue = new Date();
        }
      } catch (error) {
        initialDateValue = new Date();
      }
    }
    setSelectedDate(initialDateValue);
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
    setCurrentDateField(null);
  };

  const confirmDateSelection = (date) => {
    if (currentDateField && date && !isNaN(date.getTime())) {
      const formattedDate = format(date, 'dd/MM/yyyy');
      handleInputChange(currentDateField, formattedDate);
      setSelectedDate(date);
    }
    closeDatePicker();
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    try {
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const openDropdownPicker = (fieldName) => {
    setActiveField(fieldName);
    setShowPicker(true);
  };

  const closeDropdownPicker = () => {
    setShowPicker(false);
  };

  const selectOption = (value) => {
    handleInputChange(activeField, value);
    closeDropdownPicker();
  };

  const getDisplayValue = (field, value) => {
    if (field === 'acc_type' && value) {
      return treatmentOptions.find(option => option.toLowerCase() === value) || value;
    }
    return value;
  };

  // Add event deletion handler
  const handleEventDelete = (date, eventIndex) => { 
    const dateStr = date.toISOString().split('T')[0];
    const events = {...scheduledEvents};
    
    if (events[dateStr] && events[dateStr].length > 0) {
      const updatedEvents = [...events[dateStr]];
      updatedEvents.splice(eventIndex, 1);
      
      // If there are no more events for this date, remove the date key
      if (updatedEvents.length === 0) {
        delete events[dateStr];
      } else {
        events[dateStr] = updatedEvents;
      }
      
      // Update the parent component with the modified events
      // We need to pass this back to the SignUp2 component to update its state
      if (onEventAdd) {
        // Reusing onEventAdd as a state updater - you might want to rename this to onEventsChange in a refactor
        onEventAdd(date, null, events);
      }
    }
  };

  return (
    <View style={styles.container}>
      {fields.map(({ name, placeholder, secureTextEntry, isDateField, options }, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text style={styles.label}>{placeholder}</Text>
          <HeightSpacer height={moderateScale(4)} />

          {isDateField ? (
            <TouchableOpacity
              style={styles.datePickerField}
              onPress={() => openDatePicker(name)}
            >
              <Text style={formData[name] ? styles.dateText : styles.datePlaceholder}>
                {formData[name] ? formatDateForDisplay(formData[name]) : 'Select date'}
              </Text>
              <Ionicons name="calendar" size={20} color={COLORS.lightGray} />
            </TouchableOpacity>
          ) : name === 'acc_type' ? (
            <TouchableOpacity
              style={styles.dropdownField}
              onPress={() => openDropdownPicker(name)}
            >
              <Text style={formData[name] ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData[name] ? getDisplayValue(name, formData[name]) : "Select account type"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor={COLORS.lightGray}
              secureTextEntry={secureTextEntry}
              value={formData[name] || ''}
              onChangeText={(value) => handleInputChange(name, value)}
            />
          )}
        </View>
      ))}

      {showCalendar && (
        <View style={styles.calendarSection}>
          <Text style={styles.calendarTitle}>Set up your treatment schedule</Text>
          <Text style={styles.calendarDescription}>
            Plan your {fields.some(f => f.name === 'physioFrequency') ? 'physio sessions' : 'treatment days'} using the calendar.
          </Text>

          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowCalendarModal(true)}
          >
            <Ionicons name="calendar" size={24} color={COLORS.white} />
            <Text style={styles.calendarButtonText}>Open Treatment Calendar</Text>
          </TouchableOpacity>

          {Object.keys(scheduledEvents).length > 0 && (
            <View style={styles.eventsPreview}>
              <Text style={styles.eventsPreviewTitle}>
                {Object.keys(scheduledEvents).length} days scheduled
              </Text>
              <Text style={styles.eventsPreviewText}>
                Your treatment schedule will be saved upon signup.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Calendar modal */}
      {showCalendar && (
        <CalendarModal
          visible={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          onDateSelect={onDateSelect}
          events={scheduledEvents}
          onEventAdd={onEventAdd}
          onEventDelete={handleEventDelete} // Add the delete handler
          initialDate={initialDate}
          defaultView="week" 
        />
      )}

      <ReusableButton
        btnText={loading ? 'Processing...' : buttonText}
        onPress={() => onSubmit(formData)}
        textColor={COLORS.white}
        useGradient={true}
        gradientColors={[COLORS.gradientPurple, COLORS.gradientPink]}
        disabled={loading}
      />

      {/* ModalPicker for account type */}
      <ModalPicker
        visible={showPicker}
        options={treatmentOptions}
        onClose={closeDropdownPicker}
        onSelect={selectOption}
        title="Select Account Type"
      />

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDatePicker}
        >
          <View style={styles.datePickerContent}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={closeDatePicker}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <FullCalendarView
              currentDate={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()}
              onDateSelect={confirmDateSelection}
              selectedDate={selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : null}
            />
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeDatePicker}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => confirmDateSelection(selectedDate || new Date())}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ReusableForm;

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: moderateScale(15),
  },
  label: {
    color: COLORS.text,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  input: {
    backgroundColor: COLORS.cardDark,
    color: COLORS.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    fontSize: moderateScale(14),
  },
  dropdownField: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
  },
  dropdownText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  dropdownPlaceholder: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  // Date picker styles from SignUp2
  datePickerField: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
  },
  datePlaceholder: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContent: {
    width: '90%',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    maxHeight: '80%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(15),
  },
  datePickerTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(15),
  },
  cancelButton: {
    flex: 0.45,
    backgroundColor: COLORS.lightGray,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  confirmButton: {
    flex: 0.45,
    backgroundColor: COLORS.gradientPurple,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  calendarSection: {
    marginTop: moderateScale(5),
    padding: moderateScale(15),
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(15),
  },
  calendarTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    marginBottom: moderateScale(8),
  },
  calendarDescription: {
    color: COLORS.text,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(15),
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gradientPurple,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(8),
  },
  calendarButtonText: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginLeft: moderateScale(8),
  },
  eventsPreview: {
    marginTop: moderateScale(15),
    padding: moderateScale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: moderateScale(8),
  },
  eventsPreviewTitle: {
    color: COLORS.white,
    fontSize: moderateScale(14),
    fontWeight: 'bold',
  },
  eventsPreviewText: {
    color: COLORS.text,
    fontSize: moderateScale(12),
    marginTop: moderateScale(5),
  },
}); 