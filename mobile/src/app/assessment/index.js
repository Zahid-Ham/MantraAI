import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAssessment } from "../../context/AssessmentContext";
import { COLORS, SPACING } from "../../constants/theme";
import { assessmentSchema } from "../../data/assessmentSchema";

export default function AssessmentIndex() {
  const router = useRouter();
  const { activeAssessmentId, loading, startNewSession, answers, updateQuestionIndex } = useAssessment();
  const { questions } = assessmentSchema;

  useEffect(() => {
    const initialize = async () => {
      if (!activeAssessmentId && !loading) {
        await startNewSession();
      } else if (activeAssessmentId && !loading) {
        // Find the index of the first unanswered question
        const unansweredIndex = questions.findIndex(
          q => answers[q.id] === undefined || answers[q.id] === ""
        );

        if (unansweredIndex === -1) {
          // All questions answered, go straight to review responses
          router.replace("/assessment/review");
        } else {
          // Sync question index and redirect to target block route
          await updateQuestionIndex(unansweredIndex);
          const targetBlockId = questions[unansweredIndex].block.toString();
          router.replace(`/assessment/${targetBlockId}`);
        }
      }
    };
    initialize();
  }, [activeAssessmentId, loading, answers]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.marigold} />
      <Text style={styles.text}>Securing clinical assessment session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  text: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginTop: SPACING.md,
  },
});
