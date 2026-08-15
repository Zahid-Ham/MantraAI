import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";

export default function Assessment() {
  const router = useRouter();
  const { recoverySession, startNewSession, resumeSession, activeAssessmentId } = useAssessment();
  const { colors, language, t } = usePreferences();

  const styles = createStyles(colors);

  const handleStartNew = async () => {
    await startNewSession();
    router.push("/assessment/index");
  };

  const handleResume = async () => {
    const sessionId = recoverySession?.id || activeAssessmentId;
    if (sessionId) {
      await resumeSession(sessionId);
      router.push("/assessment/index");
    } else {
      handleStartNew();
    }
  };

  const hasIncompleteSession = !!recoverySession || !!activeAssessmentId;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader />

        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="activity" size={28} color={colors.marigold} />
          </View>
          
          <Text style={styles.title}>
            {language === "hi" ? "नैदानिक कल्याण आकलन" : "Clinical Wellness Screening"}
          </Text>
          <Text style={styles.subtitle}>
            {language === "hi" 
              ? "व्यक्तिगत साक्ष्य-आधारित रिपोर्ट तैयार करने के लिए जीवनशैली, तापमान जोखिम, मानसिक तनाव और पर्यावरणीय जोखिमों का विश्लेषण करें।"
              : "Analyze lifestyle, scrotal temperature, mental strain, and environmental exposures to generate a personalized evidence-aware report."}
          </Text>

          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Feather name="shield" size={14} color={colors.ashokaGreen} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "100% निजी और सुरक्षित एन्क्रिप्शन" : "100% Private & HIPAA-compliant encryption"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="clock" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "पूरा करने में लगभग 8-10 मिनट का समय लगता है" : "Takes approximately 8–10 minutes to complete"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Feather name="cpu" size={14} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {language === "hi" ? "Groq इंजन के माध्यम से एआई-सहायता नैदानिक फीडबैक" : "AI-assisted clinical feedback via Groq Engine"}
              </Text>
            </View>
          </View>

          {hasIncompleteSession ? (
            <View style={styles.resumeContainer}>
              <Text style={styles.resumePrompt}>
                {language === "hi" ? "आपके पास एक प्रगतिरत आकलन है।" : "You have an in-progress assessment."}
              </Text>
              <PrimaryButton
                title={language === "hi" ? "आकलन जारी रखें" : "CONTINUE ASSESSMENT"}
                variant="orange"
                onPress={handleResume}
                style={styles.actionBtn}
              />
              <PrimaryButton
                title={language === "hi" ? "नया शुरू करें" : "START NEW"}
                variant="secondary"
                onPress={handleStartNew}
                style={styles.secondaryBtn}
              />
            </View>
          ) : (
            <PrimaryButton
              title={language === "hi" ? "आकलन शुरू करें" : "START ASSESSMENT"}
              variant="primary"
              onPress={handleStartNew}
              style={styles.actionBtn}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.creamDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: "System",
    fontSize: 20,
    fontWeight: "700",
    color: colors.nightBlue,
    marginBottom: SPACING.xs,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: SPACING.xl,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  infoList: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1.2,
    borderColor: colors.border,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  infoIcon: {
    marginRight: SPACING.sm,
  },
  infoText: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  resumeContainer: {
    width: "100%",
    alignItems: "center",
  },
  resumePrompt: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: colors.marigold,
    marginBottom: SPACING.sm,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  actionBtn: {
    width: "100%",
    marginBottom: SPACING.sm,
  },
  secondaryBtn: {
    width: "100%",
  },
});
