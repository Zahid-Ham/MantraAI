import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../constants/theme";
import PrimaryButton from "./PrimaryButton";

export default function EmptyState({ 
  icon = "inbox", 
  title = "No data found", 
  description, 
  actionTitle, 
  onActionPress 
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={24} color={COLORS.textTertiary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionTitle && onActionPress && (
        <PrimaryButton 
          title={actionTitle} 
          onPress={onActionPress} 
          style={styles.button}
          variant="primary"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xxl,
    marginVertical: SPACING.xl,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.creamDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.nightBlue,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  description: {
    fontFamily: "System",
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  button: {
    minWidth: 150,
  },
});
