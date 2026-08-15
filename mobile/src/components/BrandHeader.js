import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function BrandHeader({ subtitle }) {
  const { colors } = usePreferences();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.nightBlue }]}>MANTRA.AI</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textTertiary }]}>
          {subtitle.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    letterSpacing: 2,
    backgroundColor: "transparent",
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 2,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
});
