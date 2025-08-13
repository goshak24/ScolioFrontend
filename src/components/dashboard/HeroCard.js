import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { moderateScale } from 'react-native-size-matters';
import COLORS from '../../constants/COLORS';

const HeroCard = ({ username = 'there', isPlaying = false, onToggle = () => {} }) => {
  return (
    <LinearGradient colors={[COLORS.primaryPurple, COLORS.gradientPink]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.heroCard}>
      <View style={styles.heroRow}>
        <View>
          <Text style={styles.heroTitle}>Good day, {username}!</Text>
          <Text style={styles.heroSubtitle}>Ready for another great day?</Text>
        </View>
        <View style={styles.heroIconCircle}>
          <Ionicons name="flame" size={28} color={COLORS.white} />
        </View>
      </View>
      
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(5)
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: 'bold'
  },
  heroSubtitle: {
    color: COLORS.white,
    opacity: 0.85,
    fontSize: moderateScale(12),
    marginTop: moderateScale(2)
  },
  heroIconCircle: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(27),
    backgroundColor: '#FFFFFF30',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  playButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12)
  },
  heroActionTitle: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: moderateScale(14)
  },
  heroActionSubtitle: {
    color: COLORS.white,
    opacity: 0.85,
    fontSize: moderateScale(12)
  },
});

export default HeroCard;

