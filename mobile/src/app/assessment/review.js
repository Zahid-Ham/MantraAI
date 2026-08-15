import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING, SHADOWS } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";
import SectionHeader from "../../components/SectionHeader";
import { assessmentSchema } from "../../data/assessmentSchema";

export default function AssessmentReview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { answers, updateQuestionIndex, completeAssessment, loading, error } = useAssessment();
  const { language, colors, t } = usePreferences();
  const { blocks, questions } = assessmentSchema;
  const [submitting, setSubmitting] = useState(false);

  const styles = createStyles(colors);

  // Helper to get selected option label
  const getAnswerLabel = (question, value) => {
    if (value === undefined || value === null) return language === "hi" ? "अनुत्तरित" : "Not Answered";
    
    if (question.type === "radio" || question.type === "dropdown" || question.type === "segmented") {
      const opt = question.options.find(o => o.value === value);
      return opt ? opt.label[language] : String(value);
    }
    
    if (question.type === "checkbox") {
      if (!Array.isArray(value)) return language === "hi" ? "अनुत्तरित" : "Not Answered";
      return value
        .map(v => {
          const opt = question.options.find(o => o.value === v);
          return opt ? opt.label[language] : String(v);
        })
        .join(", ");
    }
    
    if (question.type === "slider") {
      const unit = question.id === "age_years" ? (language === "hi" ? "वर्ष" : "Years") : (language === "hi" ? "अंक" : "Score");
      return `${value} ${unit}`;
    }

    return String(value);
  };

  const handleEditSection = async (blockId) => {
    // Find the index of the first question belonging to this block
    const firstQIndex = questions.findIndex(q => q.block === blockId);
    if (firstQIndex !== -1) {
      await updateQuestionIndex(firstQIndex);
      router.push(`/assessment/${blockId}?returnTo=review`);
    }
  };

  const handleSubmit = async () => {
    // Check if there are unanswered required questions
    const unansweredRequired = questions.filter(
      q => q.required && (answers[q.id] === undefined || answers[q.id] === "")
    );

    if (unansweredRequired.length > 0) {
      Alert.alert(
        language === "hi" ? "अधूरा आकलन" : "Incomplete Assessment",
        language === "hi" 
          ? `आपने ${unansweredRequired.length} आवश्यक प्रश्न अनुत्तरित छोड़ दिए हैं। कृपया सबमिट करने से पहले उन्हें पूरा करें।`
          : `You have left ${unansweredRequired.length} required questions unanswered. Please complete them before submitting.`,
        [
          { 
            text: language === "hi" ? "पहले अनुत्तरित प्रश्न पर जाएँ" : "Go to First Unanswered",
            onPress: async () => {
              const firstUnanswered = questions.findIndex(
                q => q.required && (answers[q.id] === undefined || answers[q.id] === "")
              );
              if (firstUnanswered !== -1) {
                await updateQuestionIndex(firstUnanswered);
                const blockId = questions[firstUnanswered].block;
                router.push(`/assessment/${blockId}`);
              }
            }
          },
          { text: t("cancel"), style: "cancel" }
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      const completionResult = await completeAssessment();
      if (completionResult && completionResult.success) {
        // Navigate to completion screen with the session ID
        router.replace({
          pathname: "/assessment/complete",
          params: { id: completionResult.assessmentId }
        });
      }
    } catch (e) {
      console.error("Submission failed:", e);
      Alert.alert("Submission Error", error || "Could not complete report. Please check your internet connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <BrandHeader />
        <Text style={styles.headerTitle}>REVIEW RESPONSES</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.reviewPrompt}>
          {language === "hi" 
            ? "कृपया नीचे दिए गए अपने उत्तरों की जांच करें। आपके उत्तरों का मूल्यांकन सुरक्षित रिपोर्ट एल्गोरिदम का उपयोग करके किया जाएगा।"
            : "Please verify your inputs below. Your responses will be assessed using secure clinical report algorithms."}
        </Text>

        {blocks.map((block) => {
          // Get questions belonging to this block
          const blockQuestions = questions.filter(q => q.block === block.id);
          
          return (
            <View key={block.id} style={styles.blockCard}>
              <View style={styles.blockHeader}>
                <Text style={styles.blockTitle}>{block.name[language].toUpperCase()}</Text>
                <TouchableOpacity 
                  onPress={() => handleEditSection(block.id)}
                  activeOpacity={0.6}
                  style={styles.editBtn}
                >
                  <Feather name="edit-2" size={10} color={colors.marigold} style={styles.editIcon} />
                  <Text style={styles.editText}>{language === "hi" ? "संशोधन" : "EDIT"}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.questionsList}>
                {blockQuestions.map((q, idx) => {
                  const val = answers[q.id];
                  const displayAnswer = getAnswerLabel(q, val);
                  const isLast = idx === blockQuestions.length - 1;
                  
                  return (
                    <TouchableOpacity 
                      key={q.id} 
                      activeOpacity={0.7}
                      onPress={() => router.push(`/assessment/${block.id}?editQuestionId=${q.id}&returnTo=review`)}
                      style={[styles.qItem, isLast && styles.qItemLast]}
                    >
                      <View style={styles.qTextContainer}>
                        <Text style={styles.qText}>{q.question[language]}</Text>
                        <Text style={styles.qAnswer}>{displayAnswer}</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <Text style={styles.footerAlert}>{t("readyToSubmit")}</Text>
        <PrimaryButton
          title={t("submitAssessment")}
          variant="orange"
          loading={submitting || loading}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.8,
    marginBottom: SPACING.sm,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  reviewPrompt: {
    fontFamily: "System",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  blockCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  blockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(8, 12, 22, 0.04)",
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  blockTitle: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "800",
    color: colors.nightBlue,
    letterSpacing: 1.8,
    backgroundColor: "transparent",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  editText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: colors.marigold,
    backgroundColor: "transparent",
  },
  questionsList: {
    gap: 0,
  },
  qItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(8, 12, 22, 0.04)",
    backgroundColor: "transparent",
  },
  qTextContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  qText: {
    fontFamily: "System",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  qAnswer: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.nightBlue,
    backgroundColor: "transparent",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.nightBlue,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  footerAlert: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
  },
  submitBtn: {
    width: "100%",
  },
});
