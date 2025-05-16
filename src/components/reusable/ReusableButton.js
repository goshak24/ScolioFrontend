import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { moderateScale } from 'react-native-size-matters';

const ReusableButton = ({ 
    onPress, 
    btnText, 
    borderRadius = moderateScale(8), 
    textColor = '#FFFFFF', 
    width = '100%', 
    height = moderateScale(35), 
    fontSize = moderateScale(14), 
    borderWidth = 0, 
    borderColor = 'transparent', 
    useGradient = true, 
    gradientColors = ["#9B34EF", "#E9338A"], 
    backgroundColor = '#9B34EF', 
    start = { x: 0, y: 0 }, 
    end = { x: 1, y: 1 }, 
    ...props 
}) => { 
    return (
        <TouchableOpacity 
            onPress={onPress} 
            style={[styles.buttonWrapper, { width, borderRadius }]} 
            {...props}
        >
            {useGradient ? (
                <LinearGradient
                    colors={gradientColors}
                    start={start}
                    end={end}
                    style={[
                        styles.container, 
                        { height, borderWidth, borderColor, borderRadius }
                    ]}
                >
                    <Text style={[styles.text, { color: textColor, fontSize }]}>{btnText}</Text>
                </LinearGradient>
            ) : (
                <View style={[styles.container, { 
                    backgroundColor, 
                    height,
                    borderWidth, 
                    borderColor,
                    borderRadius
                }]}>
                    <Text style={[styles.text, { color: textColor, fontSize }]}>{btnText}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default ReusableButton;

const styles = StyleSheet.create({
    buttonWrapper: {
        overflow: 'hidden',  // Ensures the gradient is clipped to the border radius
    },
    container: {
        marginTop: moderateScale(5),
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: moderateScale(10),
    },
    text: {
        fontWeight: '600',
    },
}); 