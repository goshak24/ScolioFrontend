import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import COLORS from "../../constants/COLORS";

const PostHeader = ({ onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack}>
      <Ionicons name="arrow-back" size={moderateScale(24)} color={COLORS.white} />
    </TouchableOpacity>
    <Text style={styles.headerTitle}>Discussion</Text> 
    <View style={{ width: moderateScale(24) }} />
  </View>
);

const styles = {
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: moderateScale(15),
    backgroundColor: COLORS.backgroundPurple, 
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: moderateScale(18),
    fontWeight: "bold",
  }
};

export default PostHeader;