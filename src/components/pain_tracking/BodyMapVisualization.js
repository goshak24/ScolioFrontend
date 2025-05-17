import { StyleSheet, View, Image } from 'react-native';
import React from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const BodyMapVisualization = ({ painAreas = [] }) => {
  // This component will render the body outline with highlighted pain areas
  // painAreas would be an array of objects with area id and intensity
  
  return (
    <View style={styles.container}>
      <View style={styles.bodyContainer}>
        {/* In a real implementation, you would have a real SVG or PNG body outline */}
        <Image 
          source={require('../../../assets/body-outline.png')} 
          style={styles.bodyOutline}
          resizeMode="contain"
        />
        
        {/* This would be dynamically rendered based on the painAreas data */}
        {/* For demonstration, adding a sample highlighted area */}
        {painAreas.length > 0 && (
          <View style={styles.highlightedArea} />
        )}
      </View>
    </View>
  );
};

export default BodyMapVisualization;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: moderateScale(20),
  },
  bodyContainer: {
    width: '60%',
    height: moderateScale(225),
    aspectRatio: 1,
    position: 'relative',
  },
  bodyOutline: {
    width: '100%',
    height: '100%',
  },
  highlightedArea: {
    // This is just an example highlight
    position: 'absolute',
    top: '25%',
    right: '0%',
    width: '30%',
    height: '15%',
    backgroundColor: COLORS.accentOrange,
    opacity: 0.7,
    borderRadius: moderateScale(5),
  }
});
