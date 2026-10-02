import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function BrandHeader({ subtitle }) {
  const { colors, isDarkMode } = usePreferences();

  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <MaterialCommunityIcons 
          name="dharmachakra" 
          size={20} 
          color={isDarkMode ? "#60a5fa" : "#000080"} 
        />
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: "#FF9933" }]}>MAN</Text>
          <Text style={[styles.title, { color: colors.nightBlue }]}>TRA</Text>
          <Text style={[styles.title, { color: "#128807" }]}>.AI</Text>
        </View>
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
    width: "100%",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(197, 160, 89, 0.08)", // Champagne Gold tint
    borderColor: "#c5a059", // Champagne Gold border
    borderWidth: 1.2,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignSelf: "center",
    shadowColor: "#c5a059",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 26,
    letterSpacing: 1.5,
    backgroundColor: "transparent",
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 9,
    letterSpacing: 3,
    marginTop: 8,
    fontWeight: "700",
    backgroundColor: "transparent",
  },
});
