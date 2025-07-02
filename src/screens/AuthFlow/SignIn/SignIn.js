import { StyleSheet, Text, View, SafeAreaView, Platform } from 'react-native';
import React, { useContext, useState } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../../constants/COLORS';
import HeightSpacer from '../../../components/reusable/HeightSpacer'; 
import ReusableForm from '../../../components/reusable/ReusableForm'; 
import BackButton from '../../../components/reusable/BackButton';
import { navigate, goBack } from '../../../components/navigation/navigationRef';
import { Context as AuthContext } from '../../../context/AuthContext'; 
import { Context as UserContext } from '../../../context/UserContext'; 
import { Context as NotificationContext } from '../../../context/NotificationContext';
import KeyboardAvoidingWrapper from '../../../components/reusable/KeyboardAvoidingWrapper';

const SignIn = () => {
  const { signIn } = useContext(AuthContext); 
  const { fetchUserData } = useContext(UserContext); 
  const { registerForNotifications, checkToken } = useContext(NotificationContext)

  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  // Form Fields for Sign In
  const fields = [
    { name: 'email', placeholder: 'Email', secureTextEntry: false },
    { name: 'password', placeholder: 'Password', secureTextEntry: true },
  ];

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
      email: '',
      password: '',
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

    // Check if password is provided and valid
    if (!formData.password) {
      newFieldErrors.password = 'Password is required';
      isValid = false;
    } else if (!isValidPassword(formData.password)) {
      newFieldErrors.password = 'Password must be at least 8 characters with at least one uppercase letter and one number';
      isValid = false;
    }

    setFieldErrors(newFieldErrors);
    return isValid;
  };

  // Handle Sign In Submission
  const handleSignIn = async (formData) => {
    setLoading(true);
    setError(null);

    // Validate form fields before submission
    if (!validateFields(formData)) {
      setLoading(false);
      return;
    }

    try {
      // First sign in the user
      const result = await signIn(formData);
      
      if (!result.success) {
        setError(result.error || 'Authentication failed. Please check your email and password.');
        setLoading(false);
        return;
      }
      
      if (result.idToken) {
        // Then fetch user data using the token
        await fetchUserData(result.idToken);

        // Register for notifications
        const checkTokenResult = await checkToken();
        if (!checkTokenResult) {
            await registerForNotifications();
        } else {
            console.log('Push notification token already registered');
        }
        
        // If successful, navigate to main screen
        navigate("Main");
      } else {
        setError('Authentication issue. Please try again.');
      }
    } catch (error) {
      console.error('Sign In Error:', error);
      setError(error.message || 'Sign in failed. Please try again.');
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
        <Text style={styles.title}>Welcome Back!</Text>
        <HeightSpacer height={moderateScale(10)} />
        <Text style={styles.subtitle}>Sign in to continue</Text>
        
        {/* Display error message if exists */}
        {error && (
          <>
            <HeightSpacer height={moderateScale(10)} />
            <Text style={styles.errorText}>{error}</Text>
          </>
        )}
        
        <HeightSpacer height={moderateScale(20)} />

        {/* Field validation errors */}
        {(fieldErrors.email || fieldErrors.password) && (
          <View style={styles.fieldErrorsContainer}>
            {fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
            {fieldErrors.password && <Text style={styles.fieldErrorText}>{fieldErrors.password}</Text>}
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
          onSubmit={handleSignIn} 
          buttonText="Sign In" 
          loading={loading} 
        />

        <HeightSpacer height={moderateScale(20)} />

        <Text style={styles.registerText}>
          Don't have an account? 
          <Text 
            style={styles.linkText}
            onPress={() => navigate("SignUp1")} 
          > Sign Up</Text> 
        </Text> 
        <Text style={styles.forgotPasswordText} onPress={() => navigate("ForgotPassword")}>Forgot your password?</Text>
          </View>
      </View>
    </SafeAreaView>
    </KeyboardAvoidingWrapper>
  );
};

export default SignIn;

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
  },
  registerText: {
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
  forgotPasswordText: {
    color: COLORS.pinkButtons,
    fontSize: moderateScale(14),
    marginTop: moderateScale(10),
    textDecorationLine: 'underline',
  },
});