import { StyleSheet, Text, View, SafeAreaView, Platform, TouchableOpacity } from 'react-native';
import React, { useContext, useState } from 'react';
import { Context as AuthContext } from '../../../context/AuthContext'; 
import { Context as UserContext } from '../../../context/UserContext';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import ReusableForm from '../../../components/reusable/ReusableForm';
import ReusableTextInput from '../../../components/reusable/ReusableTextInput';
import BackButton from '../../../components/reusable/BackButton';
import { goBack, navigate } from '../../../components/navigation/navigationRef';
import KeyboardAvoidingWrapper from '../../../components/reusable/KeyboardAvoidingWrapper';
import { Context as NotificationContext } from '../../../context/NotificationContext';
import HeightSpacer from '../../../components/reusable/HeightSpacer';
import FullCalendarView from '../../../components/reusable/Calendar/FullCalendarView';
import { Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';

const SignUp2 = ({ route }) => {
  const { registerForNotifications, checkToken } = useContext(NotificationContext);

  const { userData, treatmentContext } = route.params; 
  const { signUp } = useContext(AuthContext);
  const { fetchUserData } = useContext(UserContext);
  const [scheduledEvents, setScheduledEvents] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentDateField, setCurrentDateField] = useState(null);
  const [formData, setFormData] = useState({});

  const handleDateSelect = (date) => {
    // no-op unless needed
  };

  // Date picker functions
  const openDatePicker = (fieldName) => {
    setCurrentDateField(fieldName);
    
    // Safely parse existing date or use current date
    let initialDate = new Date();
    if (formData[fieldName]) {
      try {
        // If it's in DD/MM/YYYY format, convert to MM/DD/YYYY for Date constructor
        const dateStr = formData[fieldName];
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          // Create date in MM/DD/YYYY format for proper parsing
          initialDate = new Date(`${month}/${day}/${year}`);
          // Validate the date
          if (isNaN(initialDate.getTime())) {
            initialDate = new Date();
          }
        } else {
          initialDate = new Date(dateStr);
          if (isNaN(initialDate.getTime())) {
            initialDate = new Date();
          }
        }
      } catch (error) {
        console.log('Date parsing error:', error);
        initialDate = new Date();
      }
    }
    
    setSelectedDate(initialDate);
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
    setCurrentDateField(null);
  };

  const confirmDateSelection = (date) => {
    if (currentDateField && date && !isNaN(date.getTime())) {
      try {
        // Format date as DD/MM/YYYY for backend compatibility
        const formattedDate = format(date, 'dd/MM/yyyy');
        setFormData(prev => ({ ...prev, [currentDateField]: formattedDate }));
        setSelectedDate(date);
      } catch (error) {
        console.log('Date formatting error:', error);
        // Fallback to manual formatting
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}/${month}/${year}`;
        setFormData(prev => ({ ...prev, [currentDateField]: formattedDate }));
        setSelectedDate(date);
      }
    }
    closeDatePicker();
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    try {
      // If it's already in DD/MM/YYYY format, return as is
      if (dateStr.includes('/')) return dateStr;
      // Otherwise, format it
      const date = new Date(dateStr);
      return format(date, 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleAddEvent = (date, newEvent, updatedEventsObject = null) => {
    if (updatedEventsObject) {
      setScheduledEvents(updatedEventsObject);
      return;
    }

    if (!date || !newEvent) return;
    
    // Use the same date formatting function
    const formatDateForKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const dateStr = formatDateForKey(date);
    
    if (treatmentContext === 'physio') {
      if (!newEvent.type) newEvent.type = 'physio';
    } else if (treatmentContext === 'brace + physio') {
      const existingEvents = scheduledEvents[dateStr] || [];
      const hasPhysio = existingEvents.some(e => e.type === 'physio');
      const hasBrace = existingEvents.some(e => e.type === 'brace');

      if (!newEvent.type) {
        if (!hasPhysio) {
          newEvent.type = 'physio';
        } else if (!hasBrace) {
          newEvent.type = 'brace';
        } else {
          newEvent.type = 'physio';
        }
      }
    }

    setScheduledEvents(prev => ({
      ...prev,
      [dateStr]: [...(prev[dateStr] || []), newEvent]
    }));
  }; 

  const handleDeleteEvent = (date, eventIndex) => {
    if (!date) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if there are events for this date
    if (scheduledEvents[dateStr] && scheduledEvents[dateStr].length > 0) {
      // Create a new copy of the events object
      const updatedEvents = {...scheduledEvents};
      
      // Remove the event at the specified index
      updatedEvents[dateStr] = [
        ...updatedEvents[dateStr].slice(0, eventIndex),
        ...updatedEvents[dateStr].slice(eventIndex + 1)
      ];
      
      // If there are no more events for this date, remove the date key
      if (updatedEvents[dateStr].length === 0) {
        delete updatedEvents[dateStr];
      }
      
      setScheduledEvents(updatedEvents); // Replace with new copy of scheduled events 
    }
  };

  const handleSubmit = async (treatmentData) => { 
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors

      // Combine user data, form data, and treatment-specific data
      const completeData = {
        ...userData,
        ...formData,
        ...treatmentData,
        acc_type: treatmentContext,
        scheduledEvents
      };

      // Call the signUp function from the context and pass the complete data
      const result = await signUp(completeData);

      if (result.success) {
        // Use the idToken returned directly from signUp
        await fetchUserData(result.idToken);
        const checkTokenResult = await checkToken();
        if (!checkTokenResult) {
            await registerForNotifications();
        } else {
            console.log('Push notification token already registered');
        }
        navigate('Main');
      } else {
        // Handle signup failure with specific error message
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shouldShowCalendar = treatmentContext === 'physio' || treatmentContext === 'brace + physio';

  const getFormConfig = () => {
    switch (treatmentContext) {
      case 'brace':
        return {
          title: 'Brace Information',
          description: `Welcome ${userData.username}! Let's get some information about your brace treatment.`,
          fields: [
            { name: "wearingSchedule", placeholder: "How many hours do you wear the brace daily?" }
          ]
        };
      case 'physio':
        return {
          title: 'Physiotherapy Information',
          description: `Welcome ${userData.username}! Let's get some information about your physiotherapy routine.`,
          fields: [ 
          ]
        };
      case 'brace + physio':
        return {
          title: 'Brace & Physio Information',
          description: `Welcome ${userData.username}! Let's set up both your brace and physiotherapy details.`,
          fields: [
            { name: "wearingSchedule", placeholder: "Daily brace wearing hours" }, 
          ]
        };
      case 'pre-surgery':
        return {
          title: 'Pre-Surgery Information',
          description: `Welcome ${userData.username}! Let's prepare for your upcoming surgery.`,
          fields: [
            { name: "surgeryDate", placeholder: "Planned surgery date", isDateField: true }
          ]
        };
      case 'post-surgery':
        return {
          title: 'Post-Surgery Information',
          description: `Welcome ${userData.username}! Let's set up your recovery plan.`,
          fields: [
            { name: "surgeryDate", placeholder: "Date of surgery", isDateField: true }
          ]
        }; 
      default:
        return {
          title: 'Treatment Information',
          description: `Welcome ${userData.username}! Let's set up your treatment plan.`,
          fields: []
        };
    }
  };

  const { title, description, fields } = getFormConfig();

  return (
    <KeyboardAvoidingWrapper withScrollView={shouldShowCalendar}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton onPress={goBack} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.welcomeText}>{description}</Text>

          {/* Error display with same styling as SignUp1 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <HeightSpacer height={moderateScale(10)} />

          {/* Custom form fields with date pickers */}
          {fields.map((field, index) => (
            <View key={index} style={styles.inputContainer}>
              <Text style={styles.label}>{field.placeholder}</Text>
              <HeightSpacer height={moderateScale(4)} />
              
              {field.isDateField ? (
                <TouchableOpacity
                  style={styles.datePickerField}
                  onPress={() => openDatePicker(field.name)}
                >
                  <Text style={formData[field.name] ? styles.dateText : styles.datePlaceholder}>
                    {formData[field.name] ? formatDateForDisplay(formData[field.name]) : 'Select date'}
                  </Text>
                  <Ionicons name="calendar" size={20} color={COLORS.lightGray} />
                </TouchableOpacity>
              ) : (
                <ReusableTextInput
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
                />
              )}
            </View>
          ))}

          <ReusableForm 
            fields={[]} // Pass empty fields since we're rendering them above
            onSubmit={handleSubmit}
            buttonText={isSubmitting ? "Creating Account..." : "Complete Sign Up"}
            buttonDisabled={isSubmitting}
            showCalendar={shouldShowCalendar}
            scheduledEvents={scheduledEvents}
            onDateSelect={handleDateSelect}
            onEventAdd={handleAddEvent}
            onEventDelete={handleDeleteEvent}
            initialDate={new Date()}
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
      </SafeAreaView>
    </KeyboardAvoidingWrapper>
  );
}; 

export default SignUp2;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(20),
    // Fix iOS padding inconsistency
    ...(Platform.OS === 'ios' 
      ? { width: '100%' } 
      : {})
  },
  title: {
    color: COLORS.text,
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    marginBottom: moderateScale(10),
  },
  welcomeText: {
    color: COLORS.text,
    fontSize: moderateScale(16),
    textAlign: 'center',
    marginBottom: moderateScale(30),
  },
  // Error styling matching SignUp1
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  errorText: {
    color: COLORS.white, 
    textAlign: 'center', 
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
  // Date picker styles
  inputContainer: {
    width: '100%',
    marginBottom: moderateScale(15),
  },
  label: {
    color: COLORS.text,
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
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
});