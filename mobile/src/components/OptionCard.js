import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../constants/theme";

export default function OptionCard({ text, selected, onSelect }) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={[
        styles.container,
        selected ? styles.selectedContainer : styles.unselectedContainer
      ]}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
    >
      <Text style={[styles.text, selected ? styles.selectedText : styles.unselectedText]}>
        {text}
      </Text>
      <View style={[styles.circle, selected ? styles.selectedCircle : styles.unselectedCircle]}>
        {selected && (
          <Feather name="check" size={12} color={COLORS.cream} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md + 4,
    paddingHorizontal: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: SPACING.md,
    minHeight: 62,
    shadowColor: COLORS.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedContainer: {
    borderColor: COLORS.marigold,
    backgroundColor: "#fffdf9",
  },
  unselectedContainer: {
    borderColor: "rgba(8, 12, 22, 0.08)",
    backgroundColor: COLORS.white,
  },
  text: {
    fontFamily: "System",
    fontSize: 15,
    flex: 1,
    paddingRight: SPACING.md,
    backgroundColor: "transparent",
  },
  selectedText: {
    color: COLORS.nightBlue,
    fontWeight: "700",
    backgroundColor: "transparent",
  },
  unselectedText: {
    color: COLORS.textSecondary,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  selectedCircle: {
    borderColor: COLORS.marigold,
    backgroundColor: COLORS.marigold,
  },
  unselectedCircle: {
    borderColor: "rgba(8, 12, 22, 0.2)",
    backgroundColor: "transparent",
  },
});
