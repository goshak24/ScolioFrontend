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

const SignUp2 = ({ route }) => {
  const { userData, treatmentContext } = route.params; 
  const { signUp } = useContext(AuthContext);
  const { fetchUserData } = useContext(UserContext);
  const [scheduledEvents, setScheduledEvents] = useState({});

  const handleDateSelect = (date) => {
    // no-op unless needed
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
      // Combine user data and treatment-specific data
      const completeData = {
        ...userData,
        ...treatmentData,
        acc_type: treatmentContext,
        scheduledEvents
      };

      // Call the signUp function from the context and pass the complete data
      const result = await signUp(completeData);

      if (result.success) {
        // Use the idToken returned directly from signUp
        await fetchUserData(result.idToken);
        navigate('Main');
      }
    } catch (error) {
      console.error("Signup error:", error);
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
            { name: "physioFrequency", placeholder: "How many days a week do you do physiotherapy?" },
            { name: "primaryExercise", placeholder: "What's your primary exercise?" }
          ]
        };
      case 'brace + physio':
        return {
          title: 'Brace & Physio Information',
          description: `Welcome ${userData.username}! Let's set up both your brace and physiotherapy details.`,
          fields: [
            { name: "wearingSchedule", placeholder: "Daily brace wearing hours" },
            { name: "physioFrequency", placeholder: "Weekly physio sessions" }
          ]
        };
      case 'pre-surgery':
        return {
          title: 'Pre-Surgery Information',
          description: `Welcome ${userData.username}! Let's prepare for your upcoming surgery.`,
          fields: [
            { name: "surgeryDate", placeholder: "Planned surgery date (Format: DD/MM/YYYY)" }
          ]
        };
      case 'post-surgery':
        return {
          title: 'Post-Surgery Information',
          description: `Welcome ${userData.username}! Let's set up your recovery plan.`,
          fields: [
            { name: "surgeryDate", placeholder: "Date of surgery (Format: DD/MM/YYYY)" }
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

          <ReusableForm 
            fields={fields}
            onSubmit={handleSubmit}
            buttonText="Complete Sign Up"
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
  }
});