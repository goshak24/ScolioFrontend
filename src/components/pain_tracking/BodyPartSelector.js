import { StyleSheet, View, TouchableOpacity, Dimensions, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';

// Define body parts data
export const bodyParts = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'left_shoulder', label: 'Left Shoulder' },
  { id: 'right_shoulder', label: 'Right Shoulder' },
  { id: 'left_arm', label: 'Left Arm' },
  { id: 'right_arm', label: 'Right Arm' },
  { id: 'left_elbow', label: 'Left Elbow' },
  { id: 'right_elbow', label: 'Right Elbow' },
  { id: 'left_hand', label: 'Left Hand' },
  { id: 'right_hand', label: 'Right Hand' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'pelvis', label: 'Pelvis' },
  { id: 'left_hip', label: 'Left Hip' },
  { id: 'right_hip', label: 'Right Hip' },
  { id: 'left_thigh', label: 'Left Thigh' },
  { id: 'right_thigh', label: 'Right Thigh' },
  { id: 'left_knee', label: 'Left Knee' },
  { id: 'right_knee', label: 'Right Knee' },
  { id: 'left_calf', label: 'Left Calf' },
  { id: 'right_calf', label: 'Right Calf' },
  { id: 'left_foot', label: 'Left Foot' },
  { id: 'right_foot', label: 'Right Foot' },
];

const BodyPartSelector = ({ selectedAreas = [], onSelectArea }) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  
  // Handle screen dimension changes (e.g., rotation)
  useEffect(() => {
    const dimensionsHandler = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', dimensionsHandler);
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.overlayContainer}>
      {/* Head */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.head]}
        onPress={() => onSelectArea('head')}
      >
        {selectedAreas.includes('head') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>Head</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Neck */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.neck]}
        onPress={() => onSelectArea('neck')}
      >
        {selectedAreas.includes('neck') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>Neck</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Shoulder */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftShoulder]}
        onPress={() => onSelectArea('left_shoulder')}
      >
        {selectedAreas.includes('left_shoulder') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Shoulder</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Shoulder */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightShoulder]}
        onPress={() => onSelectArea('right_shoulder')}
      >
        {selectedAreas.includes('right_shoulder') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Shoulder</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Arm */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftArm]}
        onPress={() => onSelectArea('left_arm')}
      >
        {selectedAreas.includes('left_arm') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Arm</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Arm */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightArm]}
        onPress={() => onSelectArea('right_arm')}
      >
        {selectedAreas.includes('right_arm') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Arm</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Hand */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftHand]}
        onPress={() => onSelectArea('left_hand')}
      >
        {selectedAreas.includes('left_hand') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Hand</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Hand */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightHand]}
        onPress={() => onSelectArea('right_hand')}
      >
        {selectedAreas.includes('right_hand') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Hand</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Chest */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.chest]}
        onPress={() => onSelectArea('chest')}
      >
        {selectedAreas.includes('chest') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>Chest</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Abdomen */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.abdomen]}
        onPress={() => onSelectArea('abdomen')}
      >
        {selectedAreas.includes('abdomen') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>Abdomen</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Hip */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftHip]}
        onPress={() => onSelectArea('left_hip')}
      >
        {selectedAreas.includes('left_hip') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Hip</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Hip */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightHip]}
        onPress={() => onSelectArea('right_hip')}
      >
        {selectedAreas.includes('right_hip') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Hip</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Thigh */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftThigh]}
        onPress={() => onSelectArea('left_thigh')}
      >
        {selectedAreas.includes('left_thigh') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Thigh</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Thigh */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightThigh]}
        onPress={() => onSelectArea('right_thigh')}
      >
        {selectedAreas.includes('right_thigh') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Thigh</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Knee */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftKnee]}
        onPress={() => onSelectArea('left_knee')}
      >
        {selectedAreas.includes('left_knee') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Knee</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Knee */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightKnee]}
        onPress={() => onSelectArea('right_knee')}
      >
        {selectedAreas.includes('right_knee') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Knee</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Calf */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftCalf]}
        onPress={() => onSelectArea('left_calf')}
      >
        {selectedAreas.includes('left_calf') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Calf</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Calf */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightCalf]}
        onPress={() => onSelectArea('right_calf')}
      >
        {selectedAreas.includes('right_calf') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Calf</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Left Foot */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.leftFoot]}
        onPress={() => onSelectArea('left_foot')}
      >
        {selectedAreas.includes('left_foot') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>L Foot</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Right Foot */}
      <TouchableOpacity 
        style={[styles.bodyArea, styles.rightFoot]}
        onPress={() => onSelectArea('right_foot')}
      >
        {selectedAreas.includes('right_foot') && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>R Foot</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default BodyPartSelector;

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  bodyArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  indicator: {
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    marginBottom: moderateScale(2),
  },
  indicatorLabel: {
    color: '#fff',
    fontSize: moderateScale(10),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: moderateScale(4),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(4),
  },
  
  // Head - adjusted for the specific image
  head: {
    top: '3%',
    left: '35%',
    width: '30%',
    height: '9%',
    borderRadius: moderateScale(20),
  },
  
  // Neck
  neck: {
    top: '15%',
    left: '40%',
    width: '20%',
    height: '3%',
  },
  
  // Shoulders
  leftShoulder: {
    top: '20%',
    left: '30%',
    width: '20%',
    height: '5%',
  },
  rightShoulder: {
    top: '20%',
    right: '30%',
    width: '20%',
    height: '5%',
  },
  
  // Arms
  leftArm: {
    top: '25%',
    left: '27.5%',
    width: '15%',
    height: '20%',
  },
  rightArm: {
    top: '25%',
    right: '27.5%',
    width: '15%',
    height: '20%',
  },
  
  // Hands
  leftHand: {
    top: '40%',
    left: '8%',
    width: '10%',
    height: '5%',
  },
  rightHand: {
    top: '40%',
    right: '8%',
    width: '10%',
    height: '5%',
  },
  
  // Torso
  chest: {
    top: '22.5%',
    left: '35%',
    width: '26.5%',
    height: '8%',
  },
  abdomen: {
    top: '30%',
    left: '35%',
    width: '26.5%',
    height: '12%',
  },
  
  // Hips
  leftHip: {
    top: '42.5%',
    left: '32%',
    width: '17%',
    height: '7%',
  },
  rightHip: {
    top: '42.5%',
    right: '32%',
    width: '17%',
    height: '7%',
  },
  
  // Thighs
  leftThigh: {
    top: '52%',
    left: '35%',
    width: '17%',
    height: '18%',
  },
  rightThigh: {
    top: '52%',
    right: '35%',
    width: '17%',
    height: '18%',
  },
  
  // Knees
  leftKnee: {
    top: '70%',
    left: '35%',
    width: '15%',
    height: '7%',
    borderRadius: moderateScale(15),
  },
  rightKnee: {
    top: '70%',
    right: '35%',
    width: '15%',
    height: '7%',
    borderRadius: moderateScale(15),
  },
  
  // Calves
  leftCalf: {
    top: '75%',
    left: '35%',
    width: '15%',
    height: '18%',
  },
  rightCalf: {
    top: '75%',
    right: '35%',
    width: '15%',
    height: '18%',
  },
  
  // Feet
  leftFoot: {
    top: '93%',
    left: '35%',
    width: '15%',
    height: '7%',
  },
  rightFoot: {
    top: '93%',
    right: '35%',
    width: '15%',
    height: '7%',
  },
});
