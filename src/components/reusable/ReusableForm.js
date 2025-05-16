import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import ReusableButton from './ReusableButton';
import COLORS from '../../constants/COLORS';
import HeightSpacer from './HeightSpacer';
import ModalPicker from './ModalPicker'; 
import Ionicons from '@expo/vector-icons/Ionicons';
import CalendarModal from './Calendar/CalendarModal'; 

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openPicker = (fieldName) => {
    setActiveField(fieldName);
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const selectOption = (value) => {
    handleInputChange(activeField, value);
    closePicker();
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
      {fields.map(({ name, placeholder, secureTextEntry }, index) => (
        <View key={index} style={styles.inputContainer}>
          <Text style={styles.label}>{placeholder}</Text>
          <HeightSpacer height={moderateScale(4)} />

          {name === 'acc_type' ? (
            <TouchableOpacity
              style={styles.dropdownField}
              onPress={() => openPicker(name)}
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
        onClose={closePicker}
        onSelect={selectOption}
        title="Select Account Type"
      />
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