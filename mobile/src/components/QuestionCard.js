import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function QuestionCard({ sectionName, questionText, currentStep, totalSteps }) {
  const { colors } = usePreferences();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.section}>{sectionName.toUpperCase()}</Text>
        <Text style={styles.step}>
          STEP {currentStep} OF {totalSteps}
        </Text>
      </View>
      <Text style={styles.question}>{questionText}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  section: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.8,
    backgroundColor: "transparent",
  },
  step: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    backgroundColor: "transparent",
  },
  question: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    color: colors.nightBlue,
    lineHeight: 34,
    backgroundColor: "transparent",
  },
});
