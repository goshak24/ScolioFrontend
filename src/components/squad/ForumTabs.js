import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";
import COLORS from "../../constants/COLORS";

const ForumTabs = ({ activeTab, setActiveTab }) => {
  const tabs = ["Forums", "Groups", "Messages"];

  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default ForumTabs; 

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: moderateScale(10),
  },
  tab: {
    height: moderateScale(28), 
    justifyContent: 'center', 
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(20),
    backgroundColor: COLORS.tabInactive,
  },
  activeTab: {
    backgroundColor: COLORS.tabActiveStart,
  },
  tabText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  activeTabText: {
    color: COLORS.white,
  },
});
