import { StyleSheet, View, TouchableOpacity, Dimensions, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';
import { LinearGradient } from 'expo-linear-gradient';

// Define body parts data - Front and Back
export const bodyParts = [
  // Front body parts
  { id: 'head', label: 'Head', side: 'front' },
  { id: 'neck', label: 'Neck', side: 'front' },
  { id: 'left_shoulder', label: 'Left Shoulder', side: 'front' },
  { id: 'right_shoulder', label: 'Right Shoulder', side: 'front' },
  { id: 'left_arm', label: 'Left Arm', side: 'front' },
  { id: 'right_arm', label: 'Right Arm', side: 'front' },
  { id: 'left_elbow', label: 'Left Elbow', side: 'front' },
  { id: 'right_elbow', label: 'Right Elbow', side: 'front' },
  { id: 'left_hand', label: 'Left Hand', side: 'front' },
  { id: 'right_hand', label: 'Right Hand', side: 'front' },
  { id: 'chest', label: 'Chest', side: 'front' },
  { id: 'abdomen', label: 'Abdomen', side: 'front' },
  { id: 'pelvis', label: 'Pelvis', side: 'front' },
  { id: 'left_hip', label: 'Left Hip', side: 'front' },
  { id: 'right_hip', label: 'Right Hip', side: 'front' },
  { id: 'left_thigh', label: 'Left Thigh', side: 'front' },
  { id: 'right_thigh', label: 'Right Thigh', side: 'front' },
  { id: 'left_knee', label: 'Left Knee', side: 'front' },
  { id: 'right_knee', label: 'Right Knee', side: 'front' },
  { id: 'left_calf', label: 'Left Calf', side: 'front' },
  { id: 'right_calf', label: 'Right Calf', side: 'front' },
  { id: 'left_foot', label: 'Left Foot', side: 'front' },
  { id: 'right_foot', label: 'Right Foot', side: 'front' },
  
  // Back body parts
  { id: 'back_head', label: 'Back of Head', side: 'back' },
  { id: 'back_neck', label: 'Back of Neck', side: 'back' },
  { id: 'left_shoulder_back', label: 'Left Shoulder', side: 'back' },
  { id: 'right_shoulder_back', label: 'Right Shoulder', side: 'back' },
  { id: 'left_shoulder_blade', label: 'Left Shoulder Blade', side: 'back' },
  { id: 'right_shoulder_blade', label: 'Right Shoulder Blade', side: 'back' },
  { id: 'upper_spine', label: 'Upper Spine', side: 'back' },
  { id: 'left_upper_back', label: 'Left Upper Back', side: 'back' },
  { id: 'right_upper_back', label: 'Right Upper Back', side: 'back' },
  { id: 'mid_spine', label: 'Mid Spine', side: 'back' },
  { id: 'left_mid_back', label: 'Left Mid Back', side: 'back' },
  { id: 'right_mid_back', label: 'Right Mid Back', side: 'back' },
  { id: 'lower_spine', label: 'Lower Spine', side: 'back' },
  { id: 'left_lower_back', label: 'Left Lower Back', side: 'back' },
  { id: 'right_lower_back', label: 'Right Lower Back', side: 'back' },
  { id: 'left_glute', label: 'Left Glute', side: 'back' },
  { id: 'right_glute', label: 'Right Glute', side: 'back' },
  { id: 'left_back_thigh', label: 'Left Back Thigh', side: 'back' },
  { id: 'right_back_thigh', label: 'Right Back Thigh', side: 'back' },
  { id: 'left_back_knee', label: 'Left Back Knee', side: 'back' },
  { id: 'right_back_knee', label: 'Right Back Knee', side: 'back' },
  { id: 'left_back_calf', label: 'Left Back Calf', side: 'back' },
  { id: 'right_back_calf', label: 'Right Back Calf', side: 'back' },
  { id: 'left_achilles', label: 'Left Achilles', side: 'back' },
  { id: 'right_achilles', label: 'Right Achilles', side: 'back' },
];

const BodyPartSelector = ({ selectedAreas = [], onSelectArea, showBack = false }) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width); 
  
  // Handle screen dimension changes (e.g., rotation)
  useEffect(() => {
    const dimensionsHandler = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', dimensionsHandler);
    return () => subscription.remove();
  }, []);

  // Get the style mapping for each body part ID
  const getStyleForBodyPart = (id) => {
    const styleMap = {
      // Front body parts
      'head': styles.head,
      'neck': styles.neck,
      'left_shoulder': styles.leftShoulder,
      'right_shoulder': styles.rightShoulder,
      'left_arm': styles.leftArm,
      'right_arm': styles.rightArm,
      'left_elbow': styles.leftElbow,
      'right_elbow': styles.rightElbow,
      'left_hand': styles.leftHand,
      'right_hand': styles.rightHand,
      'chest': styles.chest,
      'abdomen': styles.abdomen,
      'pelvis': styles.pelvis,
      'left_hip': styles.leftHip,
      'right_hip': styles.rightHip,
      'left_thigh': styles.leftThigh,
      'right_thigh': styles.rightThigh,
      'left_knee': styles.leftKnee,
      'right_knee': styles.rightKnee,
      'left_calf': styles.leftCalf,
      'right_calf': styles.rightCalf,
      'left_foot': styles.leftFoot,
      'right_foot': styles.rightFoot,
      
      // Back body parts
      'back_head': styles.backHead,
      'back_neck': styles.backNeck,
      'left_shoulder_back': styles.leftShoulderBack,
      'right_shoulder_back': styles.rightShoulderBack,
      'left_shoulder_blade': styles.leftShoulderBlade,
      'right_shoulder_blade': styles.rightShoulderBlade,
      'upper_spine': styles.upperSpine,
      'left_upper_back': styles.leftUpperBack,
      'right_upper_back': styles.rightUpperBack,
      'mid_spine': styles.midSpine,
      'left_mid_back': styles.leftMidBack,
      'right_mid_back': styles.rightMidBack,
      'lower_spine': styles.lowerSpine,
      'left_lower_back': styles.leftLowerBack,
      'right_lower_back': styles.rightLowerBack,
      'left_glute': styles.leftButtock,
      'right_glute': styles.rightButtock,
      'left_back_thigh': styles.leftBackThigh,
      'right_back_thigh': styles.rightBackThigh, 
    };
    
    return styleMap[id] || {};
  };

  const renderBodyPart = (bodyPart) => {
    const { id, label } = bodyPart;
    const isSelected = selectedAreas.includes(id);
    const style = getStyleForBodyPart(id);
    
    return (
      <TouchableOpacity 
        key={id}
        style={[
          styles.bodyArea, 
          style,
          !isSelected && styles.dottedOutline // Add dotted outline when not selected
        ]}
        onPress={() => onSelectArea(id)}
        activeOpacity={0.7}
      >
        {isSelected && (
          <View style={styles.indicatorContainer}>
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              style={styles.indicator}
            />
            <Text style={styles.indicatorLabel}>{label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Filter body parts based on showBack prop
  const filteredBodyParts = bodyParts.filter(bodyPart => 
    showBack ? bodyPart.side === 'back' : bodyPart.side === 'front'
  );

  return (
    <View style={styles.overlayContainer}>
      {filteredBodyParts.map(bodyPart => {
        return renderBodyPart(bodyPart);
      })}
      
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
    minWidth: moderateScale(30),
    minHeight: moderateScale(30),
  },
  dottedOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.6)',
    borderStyle: 'dashed',
    borderRadius: moderateScale(4),
  },
  indicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  indicator: {
    width: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    marginBottom: moderateScale(2),
  },
  indicatorLabel: {
    color: '#fff',
    fontSize: moderateScale(9),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: moderateScale(3),
    paddingVertical: moderateScale(1),
    borderRadius: moderateScale(3),
    textAlign: 'center',
  },
  
  // ===== FRONT BODY PARTS =====
  
  // Head
  head: {
    top: '3%',
    left: '37%',
    width: '26%',
    height: '8%',
    borderRadius: moderateScale(20),
  },
  
  // Neck
  neck: {
    top: '12%',
    left: '42%',
    width: '16%',
    height: '4%',
  },
  
  // Shoulders
  leftShoulder: {
    top: '18%',
    left: '32%',
    width: '16%',
    height: '6%',
  },
  rightShoulder: {
    top: '18%',
    right: '32%',
    width: '16%',
    height: '6%',
  },
  
  // Arms
  leftArm: {
    top: '26%',
    left: '30%',
    width: '8%',
    height: '16%',
  },
  rightArm: {
    top: '26%',
    right: '30%',
    width: '8%',
    height: '16%',
  },
  
  // Hands
  leftHand: {
    top: '50%',
    left: '22.5%',
    width: '12%',
    height: '8%',
    borderRadius: moderateScale(8),
  },
  rightHand: {
    top: '50%',
    right: '22.5%',
    width: '12%',
    height: '8%',
    borderRadius: moderateScale(8),
  },
  
  // Torso
  chest: {
    top: '22%',
    left: '38%',
    width: '24%',
    height: '8%',
  },
  abdomen: {
    top: '32%',
    left: '38%',
    width: '24%',
    height: '8%',
  },
  pelvis: {
    top: '42%',
    left: '38%',
    width: '24%',
    height: '8%',
  },
  
  // Hips
  leftHip: {
    top: '42.5%',
    left: '34%',
    width: '12%',
    height: '7%',
  },
  rightHip: {
    top: '42.5%',
    right: '34%',
    width: '12%',
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

  // ===== BACK BODY PARTS =====
  
  // Back head and neck
  backHead: {
    top: '3%',
    left: '38%',
    width: '24%',
    height: '14%',
    borderRadius: moderateScale(20),
  },
  backNeck: {
    top: '18%',
    left: '42%',
    width: '16%',
    height: '8%',
  },

  // Back shoulders
  leftShoulderBack: {
    top: '26%',
    left: '30%',
    width: '16%',
    height: '6%',
  },
  rightShoulderBack: {
    top: '26%',
    right: '30%',
    width: '16%',
    height: '6%',
  },

  // Shoulder blades
  leftShoulderBlade: {
    top: '39%',
    left: '33%',
    width: '14%',
    height: '4%',
  },
  rightShoulderBlade: {
    top: '39%',
    right: '33%',
    width: '14%',
    height: '4%',
  },

  // Upper spine and back
  upperSpine: {
    top: '31%',
    left: '47%',
    width: '6%',
    height: '12%',
  },
  leftUpperBack: {
    top: '32%',
    left: '30.5%',
    width: '15%',
    height: '6%',
  },
  rightUpperBack: {
    top: '32%',
    right: '30.5%',
    width: '15%',
    height: '6%',
  },

  // Mid spine and back
  midSpine: {
    top: '45%',
    left: '47%',
    width: '6%',
    height: '10%',
  },
  leftMidBack: {
    top: '45%',
    left: '34%',
    width: '12%',
    height: '10%',
  },
  rightMidBack: {
    top: '45%',
    right: '34%',
    width: '12%',
    height: '10%',
  },

  // Lower spine and back
  lowerSpine: {
    top: '58%',
    left: '47%',
    width: '6%',
    height: '10%',
  },
  leftLowerBack: {
    top: '58%',
    left: '34%',
    width: '12%',
    height: '8%',
  },
  rightLowerBack: {
    top: '58%',
    right: '34%',
    width: '12%',
    height: '8%',
  },
  
  // Buttocks
  leftButtock: {
    top: '70%',
    left: '35%',
    width: '14%',
    height: '12%',
  },
  rightButtock: {
    top: '70%',
    right: '35%',
    width: '14%',
    height: '12%',
  },
  
  // Back thighs
  leftBackThigh: {
    top: '85%',
    left: '34%',
    width: '14%',
    height: '12%',
  },
  rightBackThigh: {
    top: '85%',
    right: '34%',
    width: '14%',
    height: '12%',
  },
});