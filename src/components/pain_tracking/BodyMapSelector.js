import { StyleSheet, View, Image, Dimensions, Text } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { moderateScale } from 'react-native-size-matters';
import BodyPartSelector from './BodyPartSelector';
import { bodyParts } from './BodyPartSelector';
import COLORS from '../../constants/COLORS';

const BodyMapSelector = ({ selectedAreas = [], onSelectArea, showBack = false }) => {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Handle screen dimension changes (e.g., rotation)
  useEffect(() => {
    const dimensionsHandler = ({ window }) => {
      setScreenWidth(window.width);
    };
    
    const subscription = Dimensions.addEventListener('change', dimensionsHandler);
    return () => subscription.remove();
  }, []);
  
  // Calculate container size based on screen dimensions
  const containerWidth = screenWidth * 0.8;
  const containerHeight = containerWidth * 2; // Maintain aspect ratio for the body image
  
  // Get the names of selected body parts for display
  const getSelectedBodyPartNames = useCallback(() => {
    return selectedAreas.map(areaId => {
      const bodyPart = bodyParts.find(part => part.id === areaId);
      return bodyPart ? bodyPart.label : '';
    }).filter(name => name !== '');
  }, [selectedAreas]);
  
  return (
    <View style={styles.container}>
      <View style={[styles.bodyContainer, { width: containerWidth, height: containerHeight }]}>
        <Image 
          source={
            showBack 
              ? require('../../../assets/body-outline-back2.png') 
              : require('../../../assets/body-outline-removebg.png')
          } 
          style={styles.bodyOutline}
          resizeMode="contain"
        />
        
        {/* Body part selection overlay */}
        <BodyPartSelector 
          selectedAreas={selectedAreas}
          onSelectArea={onSelectArea}
          showBack={showBack}
        />
      </View>
      
      {/* Selected body parts summary */}
      {selectedAreas.length > 0 && (
        <View style={styles.selectedAreasContainer}>
          <Text style={styles.selectedAreasTitle}>Selected Areas:</Text>
          <View style={styles.selectedAreasList}>
            {getSelectedBodyPartNames().map((name, index) => (
              <View key={index} style={styles.selectedAreaItem}>
                <Text style={styles.selectedAreaText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default BodyMapSelector;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: moderateScale(0)
  },
  bodyContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  bodyOutline: {
    width: '100%',
    height: '100%',
    tintColor: 'rgba(255, 255, 255, 0.7)',
  },
  selectedAreasContainer: {
    width: '90%',
    marginTop: moderateScale(10),
    padding: moderateScale(10),
    backgroundColor: 'rgba(30, 30, 40, 0.5)',
    borderRadius: moderateScale(8),
  },
  selectedAreasTitle: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: moderateScale(5),
  },
  selectedAreasList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedAreaItem: {
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    borderRadius: moderateScale(15),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(5),
    margin: moderateScale(3),
    borderWidth: 1,
    borderColor: COLORS.accentOrange,
  },
  selectedAreaText: {
    color: COLORS.white,
    fontSize: moderateScale(12),
  },
});