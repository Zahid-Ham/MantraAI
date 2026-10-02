import React from "react";
import { View, StyleSheet } from "react-native";

export default function TricolorBar({ style }) {
  return (
    <View style={[styles.barContainer, style]}>
      <View style={[styles.stripe, { backgroundColor: "#FF9933" }]} />
      <View style={[styles.stripe, { backgroundColor: "#FFFFFF" }]} />
      <View style={[styles.stripe, { backgroundColor: "#128807" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: "row",
    height: 3,
    width: "100%",
    overflow: "hidden",
  },
  stripe: {
    flex: 1,
    height: "100%",
  },
});
