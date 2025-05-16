import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import ReusableForm from '../../../components/reusable/ReusableForm';
import BackButton from '../../../components/reusable/BackButton';
import { navigate } from '../../../components/navigation/navigationRef';
import { goBack } from '../../../components/navigation/navigationRef';
import KeyboardAvoidingWrapper from '../../../components/reusable/KeyboardAvoidingWrapper';
import HeightSpacer from '../../../components/reusable/HeightSpacer';

const SignUp1 = () => {
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acc_type: ''
  });

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password requirements
  const isValidPassword = (password) => {
    // At least 8 characters, 1 uppercase letter, and 1 number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };

  // Validate form fields
  const validateFields = (formData) => {
    const newFieldErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acc_type: ''
    };
    let isValid = true;

    // Check if username is provided
    if (!formData.username || formData.username.trim() === '') {
      newFieldErrors.username = 'Username is required';
      isValid = false;
    }

    // Check if email is provided and valid
    if (!formData.email) {
      newFieldErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Check if password is provided and valid
    if (!formData.password) {
      newFieldErrors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(formData.password)) {
      newFieldErrors.password = 'Password must be at least 8 characters with at least one uppercase letter and one number';
      isValid = false;
    }

    // Check if passwords match
    if (!formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Check if treatment type is selected
    if (!formData.acc_type) {
      newFieldErrors.acc_type = 'Please select a treatment type';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  const handleFormSubmit = (data) => {
    // Validate form fields before submission
    if (!validateFields(data)) {
      return;
    }
    
    // Navigate to SignUp2 with all data and treatment context
    navigate('SignUp2', { 
      userData: data,
      treatmentContext: data.acc_type // 'brace', 'physio', 'brace + physio', etc.
    });
  }; 

  return (
    <KeyboardAvoidingWrapper>
      <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <BackButton onPress={() => goBack()} /> 
      <Text style={styles.title}>Create an Account</Text>
          
          {/* Field validation errors */}
          {(fieldErrors.username || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword || fieldErrors.acc_type) && (
            <View style={styles.fieldErrorsContainer}>
              {fieldErrors.username && <Text style={styles.fieldErrorText}>{fieldErrors.username}</Text>}
              {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
              {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}
              {fieldErrors.confirmPassword && <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>}
              {fieldErrors.acc_type && <Text style={styles.fieldErrorText}>{fieldErrors.acc_type}</Text>}
            </View>
          )}

          <HeightSpacer height={moderateScale(10)} />

      <ReusableForm 
        fields={[ 
          { name: "username", placeholder: "Username" },
          { name: "email", placeholder: "Email" }, 
          { name: "password", placeholder: "Password", secureTextEntry: true },
          { name: "confirmPassword", placeholder: "Confirm Password", secureTextEntry: true },
          { name: "acc_type", placeholder: "Select Your Treatment Type" } // Acc type selector: influences next sign up screen displayed. 
        ]}
        onSubmit={handleFormSubmit}
        buttonText="Next" 
      />
    </View>
      </SafeAreaView>
    </KeyboardAvoidingWrapper>
  );
};

export default SignUp1;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: moderateScale(30),
  },
  fieldErrorsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginBottom: moderateScale(15),
  },
  fieldErrorText: {
    color: COLORS.white, 
    textAlign: 'center', 
    fontSize: moderateScale(14),
    marginBottom: moderateScale(5),
  },
}); 