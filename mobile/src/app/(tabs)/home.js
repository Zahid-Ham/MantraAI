import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TouchableWithoutFeedback, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING, SHADOWS } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";
import TopicCard from "../../components/TopicCard";
import { topics } from "../../data/awareness/topics";
import { apiRequest } from "../../services/api";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { recoverySession, startNewSession, answers } = useAssessment();
  const { colors, t } = usePreferences();
  const [latestReport, setLatestReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animated entrance states
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sunPulse = useRef(new Animated.Value(1)).current;
  const insightScale = useRef(new Animated.Value(1)).current;

  const styles = createStyles(colors);

  // Run header and cards animations
  const runAnimations = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  };

  const startSunLoop = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sunPulse, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sunPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const fetchLatestReport = async () => {
    setLoading(true);
    try {
      const sessions = await apiRequest("/api/v1/assessments");
      const completed = sessions.filter(s => s.status === "COMPLETED");
      if (completed.length > 0) {
        // Fetch the report for the latest completed assessment
        const reportData = await apiRequest(`/api/v1/assessments/${completed[0].id}/report`);
        setLatestReport({
          id: completed[0].id,
          date: completed[0].completed_at,
          ...reportData
        });
      } else {
        setLatestReport(null);
      }
    } catch (e) {
      console.warn("Failed to load latest report on home:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLatestReport();
    runAnimations();
    startSunLoop();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLatestReport();
  };

  const handleStartAssess = () => {
    router.push("/(tabs)/assessment");
  };

  const handleReadTopic = (slug) => {
    router.push(`/awareness/${slug}`);
  };

  const handleInsightIn = () => {
    Animated.spring(insightScale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handleInsightOut = () => {
    Animated.spring(insightScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  // Get recommended topics: Sperm Production (sperm-production), Sperm Concentration (sperm-concentration)
  const recommendedTopics = topics.filter(
    t => t.slug === "sperm-production" || t.slug === "sperm-concentration"
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.marigold} />
        }
      >
        <BrandHeader />
        
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.greeting}>Good morning.</Text>
              <Animated.View style={[styles.pulseIconContainer, { transform: [{ scale: sunPulse }] }]}>
                <Feather name="sun" size={18} color={COLORS.marigold} />
              </Animated.View>
            </View>
            <Text style={styles.introParagraph}>
              Your reproductive health deserves a private space to understand it.
            </Text>
            
            <PrimaryButton
              title={recoverySession ? "RESUME ASSESSMENT" : "START ASSESSMENT"}
              variant="orange"
              onPress={handleStartAssess}
              style={styles.ctaButton}
            />
          </View>

          {/* Health Journey Progress Map */}
          <View style={styles.journeySection}>
            <Text style={styles.sectionTitle}>{t("yourHealthJourney") || "YOUR HEALTH JOURNEY"}</Text>
            <View style={styles.journeyMap}>
              <View style={styles.journeyStep}>
                <View style={[styles.stepDot, Object.keys(answers).length > 0 && styles.activeStepDot]}>
                  <Feather name="edit-3" size={10} color={colors.white} />
                </View>
                <Text style={styles.stepLabel}>{t("assess")}</Text>
              </View>
              <View style={[styles.journeyLine, Object.keys(answers).length > 0 && styles.activeJourneyLine]} />
              <View style={styles.journeyStep}>
                <View style={[styles.stepDot, styles.neutralStepDot]}>
                  <Feather name="book-open" size={10} color={colors.white} />
                </View>
                <Text style={styles.stepLabel}>{t("learn")}</Text>
              </View>
              <View style={[styles.journeyLine, latestReport && styles.activeJourneyLine]} />
              <View style={styles.journeyStep}>
                <View style={[styles.stepDot, latestReport && styles.activeStepDot]}>
                  <Feather name="file-text" size={10} color={colors.white} />
                </View>
                <Text style={styles.stepLabel}>{t("reports")}</Text>
              </View>
            </View>
          </View>

          {/* Latest Insight Card */}
          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>{t("yourLatestInsight") || "YOUR LATEST INSIGHT"}</Text>
            {latestReport ? (
              <TouchableWithoutFeedback 
                onPress={() => router.push(`/report/${latestReport.id}`)}
                onPressIn={handleInsightIn}
                onPressOut={handleInsightOut}
              >
                <Animated.View style={[styles.insightCard, { transform: [{ scale: insightScale }] }]}>
                  <Text style={styles.insightHeadline}>{latestReport.summary?.headline}</Text>
                  <Text style={styles.insightOverview} numberOfLines={3}>
                    {latestReport.summary?.overview}
                  </Text>
                  <View style={styles.insightFooter}>
                    <Text style={styles.insightStatus}>
                      STATUS: {latestReport.summary?.overall_wellness_status?.toUpperCase()}
                    </Text>
                    <Feather name="arrow-right" size={14} color={colors.marigold} />
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            ) : (
              <View style={styles.noInsightCard}>
                <Text style={styles.noInsightText}>
                  Complete your first assessment to build your personalized learning path.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Continue Learning Recommendations */}
        <View style={styles.learnSection}>
          <Text style={styles.sectionTitle}>{t("continueLearning") || "CONTINUE LEARNING"}</Text>
          {recommendedTopics.map(topic => (
            <TopicCard
              key={topic.id}
              category={topic.category}
              title={topic.title.en}
              readTime={topic.readTime}
              description={topic.shortDescription.en}
              onPress={() => handleReadTopic(topic.slug)}
            />
          ))}
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100,
  },
  welcomeSection: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.xl,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  pulseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fffdf9",
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontFamily: "System",
    fontSize: 26,
    fontWeight: "300",
    color: colors.nightBlue,
    backgroundColor: "transparent",
  },
  introParagraph: {
    fontFamily: "System",
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  ctaButton: {
    width: "100%",
  },
  journeySection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
    backgroundColor: "transparent",
  },
  journeyMap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  journeyStep: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
    marginBottom: 6,
  },
  activeStepDot: {
    backgroundColor: colors.marigold,
  },
  neutralStepDot: {
    backgroundColor: colors.nightBlue,
  },
  stepLabel: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: colors.nightBlue,
    backgroundColor: "transparent",
  },
  journeyLine: {
    height: 2,
    flex: 0.5,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  activeJourneyLine: {
    backgroundColor: colors.marigold,
  },
  insightSection: {
    marginBottom: SPACING.lg,
  },
  insightCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  insightHeadline: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    color: colors.nightBlue,
    marginBottom: SPACING.xs,
    lineHeight: 24,
    backgroundColor: "transparent",
  },
  insightOverview: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  insightFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(8, 12, 22, 0.04)",
    paddingTop: SPACING.sm,
  },
  insightStatus: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.2,
    backgroundColor: "transparent",
  },
  noInsightCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  noInsightText: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  learnSection: {
    marginBottom: SPACING.lg,
  },
});
