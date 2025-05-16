import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "../../constants/COLORS";
import { moderateScale } from "react-native-size-matters";

const LevelCard = ({ level, totalPoints, streakDays }) => {
  const levelProgress = (totalPoints % 1000) / 1000; // Progress to next level

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Level & Streak */}
        <View style={styles.header}>
          <View style={styles.levelContainer}>
            <View style={styles.crown}>
              <Ionicons name="trophy" size={24} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.levelText}>Level {level}</Text>
              <Text style={styles.pointsText}>{totalPoints} total points</Text>
            </View>
          </View>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color={COLORS.accentOrange} />
            <Text style={styles.streakText}>{streakDays} day streak</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View>
          <Text style={styles.progressText}>Progress to next level</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${levelProgress * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
  },
  card: {
    backgroundColor: COLORS.backgroundPurple,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(10),
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  crown: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: COLORS.gradientPurple,
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  levelText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: COLORS.white,
  },
  pointsText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
  },
  streakContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryPurple,
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(12),
    alignItems: "center",
  },
  streakText: {
    fontSize: moderateScale(12),
    color: COLORS.white,
    marginLeft: moderateScale(4),
  },
  progressText: {
    fontSize: moderateScale(12),
    color: COLORS.lightGray,
    marginBottom: moderateScale(4),
  },
  progressBar: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: COLORS.cardDark,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.gradientPink,
  },
});

export default LevelCard;
