import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import HeightSpacer from '../../components/reusable/HeightSpacer';
import ReusableForm from '../../components/reusable/ReusableForm';
import BackButton from '../../components/reusable/BackButton';
import { navigate, goBack } from '../../components/navigation/navigationRef';
import { Context as AuthContext } from '../../context/AuthContext'; 
import KeyboardAvoidingWrapper from '../../components/reusable/KeyboardAvoidingWrapper';

const ForgotPassword = () => {
  const { resetPassword } = useContext(AuthContext); 

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
  });

  // Form Fields for Forgot Password
  const fields = [
    { name: 'email', placeholder: 'Email', secureTextEntry: false },
  ];

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form fields
  const validateFields = (formData) => {
    const newFieldErrors = {
      email: '',
    };
    let isValid = true;

    // Check if email is provided
    if (!formData.email) {
      newFieldErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newFieldErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  // Handle Reset Password Submission
  const handleResetPassword = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate form fields before submission
    if (!validateFields(formData)) {
      setLoading(false);
      return;
    }

    try {
      // Call reset password function
      const result = await resetPassword(formData.email);
      
      if (!result.success) {
        setError(result.error || 'Failed to send reset email. Please try again.');
        setLoading(false);
        return;
      }
      
      // Show success message
      setSuccess(true);
    } catch (error) {
      console.error('Reset Password Error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingWrapper withScrollView={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton onPress={() => goBack()} /> 
          <View style={styles.formContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <HeightSpacer height={moderateScale(10)} />
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password
            </Text>
            
            {/* Display success message if email sent */}
            {success && (
              <>
                <HeightSpacer height={moderateScale(20)} />
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>
                    Reset link sent! Check your email for instructions to reset your password.
                  </Text>
                </View>
              </>
            )}
            
            {/* Display error message if exists */}
            {error && (
              <>
                <HeightSpacer height={moderateScale(10)} />
                <Text style={styles.errorText}>{error}</Text>
              </>
            )}
            
            <HeightSpacer height={moderateScale(20)} />

            {/* Field validation errors */}
            {fieldErrors.email && (
              <View style={styles.fieldErrorsContainer}>
                <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
              </View>
            )}

            {error && (
              <View style={styles.fieldErrorsContainer}>
                <Text style={styles.fieldErrorText}>{error}</Text>
              </View>
            )}

            {/* Reusable Form */}
            <ReusableForm 
              fields={fields} 
              onSubmit={handleResetPassword} 
              buttonText="Send Reset Link" 
              loading={loading} 
            />

            <HeightSpacer height={moderateScale(20)} />

            <Text style={styles.backToSignInText}>
              Remember your password? 
              <Text 
                style={styles.linkText}
                onPress={() => navigate("SignIn")} 
              > Sign In</Text> 
            </Text> 
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingWrapper>
  );
};

export default ForgotPassword;

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
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    textAlign: 'center',
    paddingHorizontal: moderateScale(10),
  },
  backToSignInText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
  },
  linkText: {
    color: COLORS.pinkButtons,
    fontWeight: '600',
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
  errorText: {
    color: COLORS.red,
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  successContainer: {
    width: '100%',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: moderateScale(8),
    padding: moderateScale(15),
  },
  successText: {
    color: COLORS.accentGreen,
    textAlign: 'center', 
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
});