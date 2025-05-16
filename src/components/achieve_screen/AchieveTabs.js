import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView } from "react-native";
import COLORS from "../../constants/COLORS";
import { moderateScale } from "react-native-size-matters";

const AchieveTabs = ({ setActiveTab }) => {
  const [activeTab, setLocalActiveTab] = useState("badges");

  const handleTabPress = (tab) => {
    setLocalActiveTab(tab);
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabsContainer}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === "badges" && styles.activeTab,
          ]}
          onPress={() => handleTabPress("badges")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "badges" && styles.activeText,
            ]}
          >
            Badges
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "progress" && styles.activeTab]}
          onPress={() => handleTabPress("progress")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "progress" && styles.activeText,
            ]}
          >
            Progress
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, activeTab === "rewards" && styles.activeTab]}
          onPress={() => handleTabPress("rewards")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rewards" && styles.activeText,
            ]}
          >
            Rewards
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    marginHorizontal: moderateScale(10), 
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardDark,
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    justifyContent: "space-between",
  },
  tabButton: {
    flex: 1,
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(10),
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: COLORS.gradientPurple,
  },
  tabText: {
    color: COLORS.lightGray,
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  activeText: {
    color: COLORS.white,
  },
});

export default AchieveTabs; 