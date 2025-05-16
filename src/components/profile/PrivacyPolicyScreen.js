import { StyleSheet, Text, View, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { moderateScale, verticalScale } from 'react-native-size-matters'
import COLORS from '../../constants/COLORS'
import BackButton from '../reusable/BackButton'
import { goBack } from '../navigation/navigationRef'
import HeightSpacer from '../reusable/HeightSpacer'
import Constants from 'expo-constants'; 

const PrivacyPolicyScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.backgroundPurple}  
        translucent={false} 
      />
      
      <LinearGradient
        colors={[COLORS.backgroundPurple, COLORS.darkBackground]}
        style={styles.gradientBackground}
      >
        <View style={styles.headerContainer}>
          <BackButton 
            onPress={() => goBack()}
            iconColor={COLORS.white}
            buttonColor="transparent"
            padding={moderateScale(10)}
            size={moderateScale(23)}
            iconName="arrow-back" 
            top={Platform.OS === 'android' ? verticalScale(40) : verticalScale(0)}
          />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
          </View>
        </View>
      
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          bounces={false}
        >
          <HeightSpacer height={moderateScale(10)} />
          
          <Text style={styles.lastUpdated}>
            Last updated: April 23, 2025
          </Text>
          
          <Text style={styles.paragraph}>
            This Privacy Policy describes how ReAlign ("we", "us", or "our") collects, uses, and protects your personal data when you use our service. It also informs you about your rights under applicable data protection laws, including the General Data Protection Regulation (GDPR).
            {'\n\n'}We collect and use your information solely to provide and improve our service. By using ReAlign, you agree to the collection and use of your information in accordance with this Privacy Policy.
          </Text>

          <Text style={styles.heading}>Interpretation and Definitions</Text>
          <Text style={styles.subheading}>Account:</Text>
          <Text style={styles.paragraph}>A unique account created for you to access our Service.</Text>

          <Text style={styles.subheading}>Application:</Text>
          <Text style={styles.paragraph}>ReAlign, the software application provided by the Company.</Text>

          <Text style={styles.subheading}>Company:</Text>
          <Text style={styles.paragraph}>ReAlign, referred to as "the Company", "We", "Us" or "Our" in this document.</Text>

          <Text style={styles.subheading}>Country:</Text>
          <Text style={styles.paragraph}>United Kingdom</Text>

          <Text style={styles.subheading}>Device:</Text>
          <Text style={styles.paragraph}>Any device such as a computer, mobile phone, or tablet that can access the Service.</Text>

          <Text style={styles.subheading}>Personal Data:</Text>
          <Text style={styles.paragraph}>Information that relates to an identified or identifiable individual.</Text>

          <Text style={styles.subheading}>Service:</Text>
          <Text style={styles.paragraph}>The ReAlign application.</Text>

          <Text style={styles.subheading}>Service Provider:</Text>
          <Text style={styles.paragraph}>Third-party companies or individuals that process data on behalf of the Company.</Text>

          <Text style={styles.subheading}>Usage Data:</Text>
          <Text style={styles.paragraph}>Data collected automatically from the use of the Service.</Text>

          <Text style={styles.subheading}>You:</Text>
          <Text style={styles.paragraph}>The individual using the Service.</Text>

          <Text style={styles.heading}>Collecting and Using Your Personal Data</Text>
          <Text style={styles.subheading}>Personal Data:</Text>
          <Text style={styles.paragraph}>Currently, the only personal data we collect directly is your email address when you register an account with us.</Text>

          <Text style={styles.subheading}>Usage Data:</Text>
          <Text style={styles.paragraph}>We collect certain technical data automatically, including your IP address, browser type and version, device type, pages visited, and the time and date of your visit.</Text>

          <Text style={styles.heading}>Legal Bases for Processing (GDPR Compliance)</Text>
          <Text style={styles.paragraph}>
            We process your personal data based on:
            {'\n\n'}• Performance of a Contract
            {'\n'}• Your Consent
            {'\n'}• Compliance with Legal Obligations
            {'\n'}• Legitimate Interests
          </Text>

          <Text style={styles.heading}>How We Use Your Data</Text>
          <Text style={styles.paragraph}>
            We use your data to:
            {'\n\n'}• Provide and maintain the Service
            {'\n'}• Manage your account
            {'\n'}• Respond to your requests
            {'\n'}• Monitor usage
            {'\n'}• Allow account deletion
          </Text>

          <Text style={styles.heading}>Data Retention</Text>
          <Text style={styles.paragraph}>We retain your data only as long as necessary. You can request deletion anytime.</Text>

          <Text style={styles.heading}>Data Security</Text>
          <Text style={styles.paragraph}>Your data is securely stored using Firestore (Google Cloud). We use standard security practices but cannot guarantee 100% security.</Text>

          <Text style={styles.heading}>International Data Transfers</Text>
          <Text style={styles.paragraph}>Your data may be processed outside your country, including the US and EEA. Safeguards like Standard Contractual Clauses are in place.</Text>

          <Text style={styles.heading}>Your Rights (Under GDPR)</Text>
          <Text style={styles.paragraph}>
            You have the right to:
            {'\n\n'}• Access
            {'\n'}• Rectify
            {'\n'}• Delete
            {'\n'}• Restrict or object to processing
            {'\n'}• Withdraw consent
            {'\n'}• Lodge a complaint
          </Text>

          <Text style={styles.paragraph}>To exercise these rights, contact us at: george@wearerealign.com</Text>

          <Text style={styles.heading}>Children's Privacy</Text>
          <Text style={styles.paragraph}>Our service is not for users under 13. We do not knowingly collect data from children.</Text>

          <Text style={styles.heading}>Changes to This Privacy Policy</Text>
          <Text style={styles.paragraph}>We may update this policy and notify you of major changes via email and on this page.</Text>

          <Text style={styles.heading}>Contact Us</Text>
          <Text style={styles.paragraph}>📧 george@wearerealign.com</Text>
          <Text style={styles.paragraph}>📧 yasamin@wearerealign.com</Text>

          <HeightSpacer height={moderateScale(20)} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

export default PrivacyPolicyScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundPurple,
  },
  gradientBackground: {
    flex: 1,
  },
  headerContainer: {
    width: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(5) : moderateScale(8),
    paddingBottom: moderateScale(15),  
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
  },
  lastUpdated: {
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
    marginBottom: moderateScale(10),
  },
  heading: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: moderateScale(20),
    marginBottom: moderateScale(8),
  },
  subheading: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: COLORS.lightPurple,
    marginTop: moderateScale(12),
    marginBottom: moderateScale(4),
  },
  paragraph: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(22),
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: moderateScale(8),
  },
}) 