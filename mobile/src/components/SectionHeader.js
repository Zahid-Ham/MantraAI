import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title?.toUpperCase()}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    backgroundColor: "transparent",
  },
  title: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.nightBlue,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  line: {
    height: 1,
    backgroundColor: COLORS.border,
    width: "100%",
    marginTop: 4,
  },
});
