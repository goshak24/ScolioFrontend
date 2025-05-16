import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ReusableText = ({ marginTop, text, color, font, fontSize, textAlign }) => {
    const styles = StyleSheet.create({
        container: {
            marginTop: marginTop
        }, 
        textStyle: {
            color: color,
            fontFamily: font, 
            fontSize: fontSize, 
            textAlign: textAlign
        }
    }) 

    return (
        <View style={styles.container}>
            <Text style={styles.textStyle}>{text}</Text>
        </View>
    )
}

export default ReusableText 