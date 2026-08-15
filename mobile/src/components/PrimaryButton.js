import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export default function PrimaryButton({ 
  onPress, 
  title, 
  variant = "primary", // primary, secondary, orange
  loading = false, 
  disabled = false,
  style 
}) {
  const isPrimary = variant === "primary";
  const isOrange = variant === "orange";
  
  const buttonStyles = [
    styles.button,
    isPrimary && styles.primaryButton,
    isOrange && styles.orangeButton,
    !isPrimary && !isOrange && styles.secondaryButton,
    disabled && styles.disabledButton,
    style
  ];

  const textStyles = [
    styles.text,
    isPrimary && styles.primaryText,
    isOrange && styles.orangeText,
    !isPrimary && !isOrange && styles.secondaryText,
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={buttonStyles}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={isPrimary || isOrange ? COLORS.cream : COLORS.nightBlue} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  primaryButton: {
    backgroundColor: COLORS.nightBlue,
  },
  orangeButton: {
    backgroundColor: COLORS.marigold,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: COLORS.border,
  },
  disabledButton: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  text: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  primaryText: {
    color: COLORS.cream,
  },
  orangeText: {
    color: COLORS.cream,
  },
  secondaryText: {
    color: COLORS.nightBlue,
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
});
