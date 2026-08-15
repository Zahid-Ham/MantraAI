import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

export default function QuestionCard({ sectionName, questionText, currentStep, totalSteps }) {
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

const styles = StyleSheet.create({
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
    color: COLORS.marigold,
    letterSpacing: 1.8,
  },
  step: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
  },
  question: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 28,
    color: COLORS.nightBlue,
    lineHeight: 34,
  },
});
