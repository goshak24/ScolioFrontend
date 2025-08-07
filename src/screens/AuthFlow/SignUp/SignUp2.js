import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { Context as AuthContext } from '../../../context/AuthContext';
import { Context as UserContext } from '../../../context/UserContext';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import ReusableForm from '../../../components/reusable/ReusableForm';
import BackButton from '../../../components/reusable/BackButton';
import { goBack, navigate } from '../../../components/navigation/navigationRef';
import KeyboardAvoidingWrapper from '../../../components/reusable/KeyboardAvoidingWrapper';
import { Context as NotificationContext } from '../../../context/NotificationContext';
import HeightSpacer from '../../../components/reusable/HeightSpacer';

const SignUp2 = ({ route }) => {
  const { registerForNotifications, checkToken } = useContext(NotificationContext);

  const { userData, treatmentContext } = route.params;
  const { signUp } = useContext(AuthContext);
  const { fetchUserData } = useContext(UserContext);
  const [scheduledEvents, setScheduledEvents] = useState({});
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateSelect = (date) => {
    // no-op unless needed
  };

  const handleAddEvent = (date, newEvent, updatedEventsObject = null) => {
    if (updatedEventsObject) {
      setScheduledEvents(updatedEventsObject);
      return;
    }

    if (!date || !newEvent) return;

    const formatDateForKey = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateStr = formatDateForKey(date);

    // The event type is now set in the EventForm, so the complex logic here is removed.
    // This ensures that any number of physio or brace events can be added.
    if (!newEvent.type) {
      if (treatmentContext === 'physio') {
        newEvent.type = 'physio';
      } else if (treatmentContext === 'brace + physio') {
        // Default to physio if type is not specified
        newEvent.type = 'physio';
      }
    }

    setScheduledEvents(prev => {
      const updatedEvents = [...(prev[dateStr] || []), newEvent];
      return {
        ...prev,
        [dateStr]: updatedEvents,
      };
    });
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

  const handleSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const completeData = {
        ...userData,
        ...formData,
        acc_type: treatmentContext,
        scheduledEvents,
      };

      const result = await signUp(completeData);

      if (result.success) {
        await fetchUserData(result.idToken);
        const checkTokenResult = await checkToken();
        if (!checkTokenResult) {
          await registerForNotifications();
        } else {
          console.log('Push notification token already registered');
        }
        navigate('Main');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error("Signup error:", err);
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

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <HeightSpacer height={moderateScale(10)} />

          <ReusableForm
            fields={fields}
            onSubmit={handleSubmit}
            buttonText={isSubmitting ? "Creating Account..." : "Complete Sign Up"}
            loading={isSubmitting}
            showCalendar={shouldShowCalendar}
            scheduledEvents={scheduledEvents}
            onDateSelect={handleDateSelect}
            onEventAdd={handleAddEvent}
            onEventDelete={handleDeleteEvent}
            initialDate={new Date()}
          />
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
    ...(Platform.OS === 'ios' ? { width: '100%' } : {}),
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
});