import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { moderateScale } from 'react-native-size-matters'
import COLORS from '../../constants/COLORS'
import LevelCard from './LevelCard'

const AchieveHeader = ({ level, streakDays }) => {

    return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Achievements</Text>

      <LevelCard level={level} streakDays={streakDays} /> 

      
    </View>
  )
}

export default AchieveHeader

const styles = StyleSheet.create({ 
    container: {
        paddingHorizontal: moderateScale(10), 
        marginBottom: moderateScale(5)
    }, 
    headerText: {
        color: COLORS.white,
        fontSize: moderateScale(22), 
        fontWeight: "bold",  
        marginBottom: moderateScale(15) 
    }
})