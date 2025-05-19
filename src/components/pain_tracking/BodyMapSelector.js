import { StyleSheet, View, Image, Dimensions } from 'react-native';
import React, { useState, useEffect } from 'react';
import { moderateScale } from 'react-native-size-matters';
import BodyPartSelector from './BodyPartSelector';

const BodyMapSelector = ({ selectedAreas = [], onSelectArea }) => {
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
  
  return (
    <View style={styles.container}>
      <View style={[styles.bodyContainer, { width: containerWidth, height: containerHeight }]}>
        <Image 
          source={require('../../../assets/body-outline-removebg.png')} 
          style={styles.bodyOutline}
          resizeMode="contain"
        />
        
        {/* Body part selection overlay */}
        <BodyPartSelector 
          selectedAreas={selectedAreas}
          onSelectArea={onSelectArea}
        />
      </View>
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
});