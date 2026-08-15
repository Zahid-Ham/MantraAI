import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function PrimaryButton({ 
  onPress, 
  title, 
  variant = "primary", // primary, secondary, orange
  loading = false, 
  disabled = false,
  style 
}) {
  const { colors, isDarkMode } = usePreferences();
  const styles = createStyles(colors, isDarkMode);

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
          color={isPrimary || isOrange ? colors.cream : colors.nightBlue} 
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  button: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  primaryButton: {
    backgroundColor: colors.nightBlue,
  },
  orangeButton: {
    backgroundColor: colors.marigold,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: colors.border,
  },
  disabledButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  text: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  primaryText: {
    color: colors.cream,
  },
  orangeText: {
    color: colors.cream,
  },
  secondaryText: {
    color: colors.nightBlue,
  },
  disabledText: {
    color: colors.textTertiary,
  },
});
