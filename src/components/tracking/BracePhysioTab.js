import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '../../constants/COLORS';
import WorkoutInterface from './WorkoutInterface';
import HeightSpacer from '../reusable/HeightSpacer';
import BraceTrackerInterface from './BraceTrackerInterface';

const BracePhysioTab = ({ 
  workouts, 
  weeklySchedule, 
  braceData, 
  wearingSchedule, 
  customHeader, 
  onActivityCompleteBrace, 
  onActivityCompletePhysio, 
  onBadgeEarned = () => {},
  showSuccess, 
  successMessage,
  isStreakAnimationActive = false,
  isProcessingActivity = false,
  onNewBadgeEarned = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('Brace'); 

  return (
    <View>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['Brace', 'Physio'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={styles.tabWrapper}
              activeOpacity={0.85}
            >
              {isActive ? (
                <LinearGradient
                  colors= {activeTab == 'Brace' ? [COLORS.primaryPurple, COLORS.primaryPurple] : [COLORS.accentGreen, "#0D9488"]} 
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabGradient}
                >
                  <Text style={[styles.tabText, styles.activeTabText]}>{tab}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <Text style={styles.tabText}>{tab}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'Brace' ? ( 
        <View>
          <BraceTrackerInterface 
            data={braceData} 
            wearingSchedule={wearingSchedule}
            onActivityComplete={onActivityCompleteBrace}
            onBadgeEarned={onBadgeEarned}
            showSuccess={showSuccess}
            successMessage={successMessage}
            isStreakAnimationActive={isStreakAnimationActive}
            isProcessingActivity={isProcessingActivity}
            onNewBadgeEarned={onNewBadgeEarned}
          /> 
        </View> 
      ) : (
        <View>
          <WorkoutInterface 
            workouts={workouts} 
            weeklySchedule={weeklySchedule}
            customHeader={customHeader} 
            onActivityComplete={(date, workoutName) => onActivityCompletePhysio(date, workoutName)}
            showSuccess={showSuccess}
            successMessage={successMessage}
          /> 
        </View>
      )}
    </View>
  );
};

export default BracePhysioTab;

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    overflow: 'hidden'
  },
  tabWrapper: {
    flex: 1,
  },
  tabGradient: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveTab: {
    paddingVertical: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontWeight: 'bold', 
    fontSize: moderateScale(14),
    color: COLORS.lightGray,
  },
  activeTabText: {
    color: COLORS.white,
  }
}); 