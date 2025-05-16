import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import COLORS from '../constants/COLORS'; 
import MicTab from '../components/ai/MicTab';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants'; 
import AIChatButton from '../components/ai/AIChatButton';
import ChatInterface from '../components/ai/ChatInterface';

const AI = () => {
  const [showVoicePrompt, setShowVoicePrompt] = useState(false); 
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const suggestedQuestions = [
    { id: '1', text: 'How can I make my brace more comfortable?' },
    { id: '2', text: 'What exercises help with back pain?' },
    { id: '3', text: 'How do I explain scoliosis to my friends?' },
    { id: '4', text: 'Will my curve get worse if I skip exercises?' },
    { id: '5', text: 'Tips for sleeping with a brace?' },
    { id: '6', text: 'What foods help with bone health?' }, 
  ];

  const handleQuestionPress = (question) => {
    setSelectedQuestion(question);
    setShowChatInterface(true);
  };

  // If chat interface is visible, show it and hide the regular AI screen
  if (showChatInterface) {
    return (
      <>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor={COLORS.cardDark} 
          translucent={false} 
        />
        <ChatInterface 
          isVisible={showChatInterface} 
          onClose={() => {
            setShowChatInterface(false);
            setSelectedQuestion(null);
          }}
          initialQuestion={selectedQuestion}
        />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={COLORS.darkBackground} 
        translucent={false} 
      />
      <ScrollView 
        style={styles.scrollView} 
        bounces={false} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Your AI Bestie</Text>
              <Text style={styles.headerSubtitle}>Ask me anything about scoliosis</Text>
            </View>
            <LinearGradient colors={["#9B34EF", "#E9338A"]} style={styles.micGradient}>
              <TouchableOpacity onPress={() => setShowVoicePrompt(!showVoicePrompt)}>
                  <Ionicons 
                    name={"mic"} 
                    size={moderateScale(24)} 
                    color={COLORS.white} 
                  />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Voice Assistant Tab (Appears when "mic" is clicked) */}
          {showVoicePrompt && <MicTab onClose={() => setShowVoicePrompt(false)} />} 

          {/* Suggested Questions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles" size={moderateScale(18)} color={COLORS.pinkButtons} />
              <Text style={styles.sectionTitle}>How can I help you today?</Text>
            </View>
            <View style={styles.questionsContainer}>
              {suggestedQuestions.map((item) => (
                <TouchableOpacity 
                  key={item.id}
                  style={styles.questionButton}
                  onPress={() => handleQuestionPress(item.text)}
                >
                  <Text style={styles.questionText}>{item.text}</Text> 
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* About AI Assistant */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle-outline" size={moderateScale(18)} color={COLORS.lightGray} />
              <Text style={styles.sectionTitle}>About your AI assistant</Text>
            </View>
            <Text style={styles.aboutText}>
              I'm here to support your scoliosis journey with advice, information, and encouragement.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Chat Button (moved to bottom) */}
      <View style={styles.bottomButtonContainer}>
        <AIChatButton onPress={() => setShowChatInterface(true)} />
      </View>
    </SafeAreaView>
  );
};

export default AI;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: moderateScale(10),
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight + moderateScale(10) : moderateScale(10),  
    paddingBottom: moderateScale(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: moderateScale(15), 
  },
  headerTextContainer: {
    flex: 1, 
  },
  headerTitle: {
    fontSize: moderateScale(22),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  section: {
    backgroundColor: COLORS.cardDark,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: moderateScale(15),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: moderateScale(6),
  },
  questionsContainer: {
    marginTop: moderateScale(5),
  },
  questionButton: {
    backgroundColor: COLORS.workoutOption,
    padding: moderateScale(12),
    borderRadius: moderateScale(10),
    marginVertical: moderateScale(5), 
  },
  micGradient: {
    padding: moderateScale(8), 
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: moderateScale(50),
  },
  questionText: {
    color: COLORS.white,
    fontSize: moderateScale(13),
  },
  aboutText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  bottomButtonContainer: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(16),
    backgroundColor: COLORS.darkBackground,
  }
}); 