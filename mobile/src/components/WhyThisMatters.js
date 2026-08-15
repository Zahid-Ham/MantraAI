import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function WhyThisMatters({ text }) {
  const [expanded, setExpanded] = useState(false);
  const { colors, isDarkMode } = usePreferences();
  const styles = createStyles(colors, isDarkMode);

  if (!text) return null;

  return (
    <View style={[styles.container, expanded && styles.expandedContainer]}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel="Why are we asking this?"
      >
        <View style={styles.titleContainer}>
          <Feather name="info" size={15} color={colors.marigold} style={styles.infoIcon} />
          <Text style={styles.title}>WHY ARE WE ASKING?</Text>
        </View>
        <Feather 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={colors.textTertiary} 
        />
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.content}>
          <Text style={styles.description}>{text}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.white,
    overflow: "hidden",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  expandedContainer: {
    borderColor: isDarkMode ? "rgba(217, 119, 6, 0.3)" : "rgba(217, 119, 6, 0.2)",
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: SPACING.sm,
  },
  title: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "800",
    color: colors.nightBlue,
    letterSpacing: 1.5,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 18,
  },
  description: {
    fontFamily: "System",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
});
