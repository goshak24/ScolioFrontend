import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import React from 'react';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const BodyMapSelector = ({ selectedAreas = [], onSelectArea }) => {
  // This component will render the body outline where users can select pain areas
  return (
    <View style={styles.container}>
      <View style={styles.bodyContainer}>
        <Image 
          source={require('../../../assets/body-outline.png')} 
          style={styles.bodyOutline}
          resizeMode="contain"
        />
        {/* You would need to add specific touchable areas on top of the image */}
        {/* For example: */}
        {/* <TouchableOpacity 
          style={[
            styles.bodyArea, 
            styles.neck,
            selectedAreas.includes('neck') && styles.selectedArea
          ]}
          onPress={() => onSelectArea('neck')}
        /> */}
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
    marginVertical: moderateScale(20),
  },
  bodyContainer: {
    width: '80%',
    height: moderateScale(225),
    aspectRatio: 1,
    position: 'relative',
  },
  bodyOutline: {
    width: '100%',
    height: '100%',
  },
  bodyArea: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedArea: {
    backgroundColor: 'rgba(255, 72, 59, 0.5)',
    borderColor: COLORS.primary,
  }
});
