import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export default function ProgressBar({ progress }) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.fill, 
          { width: `${clampedProgress * 100}%` }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 4,
    width: "100%",
    backgroundColor: "rgba(8, 12, 22, 0.05)",
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: SPACING.sm,
  },
  fill: {
    height: "100%",
    backgroundColor: COLORS.marigold,
    borderRadius: 2,
  },
});
