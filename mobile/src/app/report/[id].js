import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING, SHADOWS } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import SectionHeader from "../../components/SectionHeader";
import EmptyState from "../../components/EmptyState";
import { apiRequest } from "../../services/api";

export default function ReportViewer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, language, isDarkMode } = usePreferences();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accordion open/close state
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    findings: false,
    priorityActions: false,
    reproductive: false,
    sexual: false,
    mental: false,
    lifestyle: false,
    guidance: false
  });

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/v1/assessments/${id}/report`);
      setReport(data);
    } catch (err) {
      console.error("Failed to load report detail:", err);
      setError("Unable to load the clinical wellness report from the database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  if (loading) {
    const styles = createStyles(colors, isDarkMode);
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.marigold} />
          <Text style={styles.loadingText}>Compiling health variables...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    const styles = createStyles(colors, isDarkMode);
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.nightBlue} />
          </TouchableOpacity>
          <BrandHeader />
          <View style={styles.placeholder} />
        </View>
        <EmptyState
          icon="alert-triangle"
          title="Report Unavailable"
          description={error || "The requested report is not available."}
          actionTitle="Go to Reports History"
          onActionPress={() => router.replace("/(tabs)/reports")}
        />
      </SafeAreaView>
    );
  }

  // Get color for overall wellness status
  const getStatusColor = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case "stable":
      case "mostly stable":
        return colors.ashokaGreen;
      case "worth monitoring":
        return colors.marigold;
      default:
        return "#dc2626";
    }
  };

  const getSeverityBadgeStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case "notable":
        return { color: "#dc2626", bg: "rgba(220, 38, 38, 0.05)" };
      case "moderate":
        return { color: colors.marigold, bg: "rgba(217, 119, 6, 0.05)" };
      default:
        return { color: colors.ashokaGreen, bg: "rgba(6, 95, 70, 0.05)" };
    }
  };

  const getScoreFromStatus = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case "stable":
      case "mostly stable":
        return 92;
      case "worth monitoring":
        return 74;
      default:
        return 58;
    }
  };

  const getScoreRatingText = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case "stable":
      case "mostly stable":
        return "Optimal Wellness";
      case "worth monitoring":
        return "Moderate Stressors";
      default:
        return "Attention Required";
    }
  };

  const statusColor = getStatusColor(report.summary?.overall_wellness_status);
  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
          <Feather name="arrow-left" size={20} color={colors.nightBlue} />
        </TouchableOpacity>
        <BrandHeader />
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Vitality Index Hero Gauge Card */}
        <View style={styles.heroCard}>
          <View style={[styles.gaugeCircle, { borderColor: statusColor }]}>
            <Text style={styles.gaugeSubtext}>VITALITY</Text>
            <Text style={styles.gaugeValue}>{getScoreFromStatus(report.summary?.overall_wellness_status)}</Text>
            <Text style={styles.gaugeMax}>/ 100</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>WELLNESS INDEX</Text>
            <Text style={styles.heroTitle}>{getScoreRatingText(report.summary?.overall_wellness_status)}</Text>
            <Text style={styles.heroDescription}>
              Compiled from 86 bio-lifestyle and clinical screening variables.
            </Text>
          </View>
        </View>

        {/* Accordion 1: Overview */}
        <View style={[styles.accordionCard, expandedSections.overview && styles.accordionCardExpanded]}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => toggleSection("overview")}
            style={[styles.accordionHeader, expandedSections.overview && styles.accordionHeaderExpanded]}
          >
            <Text style={styles.accordionTitle}>OVERVIEW SUMMARY</Text>
            <Feather 
              name={expandedSections.overview ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
          {expandedSections.overview && (
            <View style={styles.accordionContent}>
              <Text style={styles.headline}>{report.summary?.headline}</Text>
              <Text style={styles.overviewText}>{report.summary?.overview}</Text>
              
              <View style={[styles.statusBadge, { borderColor: statusColor + "30" }]}>
                <Text style={styles.statusLabel}>OVERALL ASSESSMENT STATUS</Text>
                <Text style={[styles.statusValue, { color: statusColor }]}>
                  {report.summary?.overall_wellness_status?.toUpperCase()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Accordion 2: Key Findings */}
        {report.key_findings && report.key_findings.length > 0 && (
          <View style={[styles.accordionCard, expandedSections.findings && styles.accordionCardExpanded]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => toggleSection("findings")}
              style={[styles.accordionHeader, expandedSections.findings && styles.accordionHeaderExpanded]}
            >
              <Text style={styles.accordionTitle}>KEY FINDINGS ({report.key_findings.length})</Text>
              <Feather 
                name={expandedSections.findings ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={colors.textTertiary} 
              />
            </TouchableOpacity>
            {expandedSections.findings && (
              <View style={styles.accordionContent}>
                {report.key_findings.map((finding, idx) => {
                  const badgeStyle = getSeverityBadgeStyle(finding.severity);
                  return (
                    <View key={idx} style={styles.findingItem}>
                      <View style={styles.findingMeta}>
                        <Text style={styles.findingTitle}>{finding.title}</Text>
                        <View style={[styles.findingBadge, { backgroundColor: badgeStyle.bg }]}>
                          <Text style={[styles.findingBadgeText, { color: badgeStyle.color }]}>
                            {finding.severity?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.findingText}>{finding.explanation}</Text>
                      {finding.evidence && finding.evidence.length > 0 && (
                        <View style={styles.evidenceBox}>
                          <Text style={styles.evidenceLabel}>EVIDENCE BASE:</Text>
                          {finding.evidence.map((ev, eIdx) => (
                            <Text key={eIdx} style={styles.evidenceText}>• {ev}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Accordion 3: Priority Actions */}
        {report.priority_actions && report.priority_actions.length > 0 && (
          <View style={[styles.accordionCard, expandedSections.priorityActions && styles.accordionCardExpanded]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => toggleSection("priorityActions")}
              style={[styles.accordionHeader, expandedSections.priorityActions && styles.accordionHeaderExpanded]}
            >
              <Text style={styles.accordionTitle}>RECOMMENDED ACTIONS</Text>
              <Feather 
                name={expandedSections.priorityActions ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={COLORS.textTertiary} 
              />
            </TouchableOpacity>
            {expandedSections.priorityActions && (
              <View style={styles.accordionContent}>
                {report.priority_actions.map((act, idx) => (
                  <View key={idx} style={styles.actionItem}>
                    <View style={styles.actionNumberCircle}>
                      <Text style={styles.actionNumber}>{act.priority}</Text>
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionArea}>{act.area.toUpperCase()}</Text>
                      <Text style={styles.actionText}>{act.action}</Text>
                      <Text style={styles.actionReason}>{act.reason}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Accordion 4: Reproductive Health Details */}
        {report.reproductive_health && (
          <View style={[styles.accordionCard, expandedSections.reproductive && styles.accordionCardExpanded]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => toggleSection("reproductive")}
              style={[styles.accordionHeader, expandedSections.reproductive && styles.accordionHeaderExpanded]}
            >
              <Text style={styles.accordionTitle}>REPRODUCTIVE HEALTH FACTORING</Text>
              <Feather 
                name={expandedSections.reproductive ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={COLORS.textTertiary} 
              />
            </TouchableOpacity>
            {expandedSections.reproductive && (
              <View style={styles.accordionContent}>
                <Text style={styles.sectionSummary}>{report.reproductive_health.summary}</Text>
                
                {report.reproductive_health.relevant_factors?.length > 0 && (
                  <View style={styles.factorSubList}>
                    <Text style={styles.factorSubHeader}>RELEVANT CONTEXT FACTORS</Text>
                    {report.reproductive_health.relevant_factors.map((f, idx) => (
                      <Text key={idx} style={styles.factorText}>• {f}</Text>
                    ))}
                  </View>
                )}
                
                {report.reproductive_health.protective_factors?.length > 0 && (
                  <View style={styles.factorSubList}>
                    <Text style={styles.factorSubHeader}>PROTECTIVE FACTORS</Text>
                    {report.reproductive_health.protective_factors.map((f, idx) => (
                      <Text key={idx} style={styles.factorText}>• {f}</Text>
                    ))}
                  </View>
                )}

                {report.reproductive_health.areas_to_monitor?.length > 0 && (
                  <View style={styles.factorSubList}>
                    <Text style={styles.factorSubHeader}>AREAS WORTH MONITORING</Text>
                    {report.reproductive_health.areas_to_monitor.map((f, idx) => (
                      <Text key={idx} style={styles.factorText}>• {f}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Accordion 5: Sexual Health */}
        {report.sexual_health && (
          <View style={[styles.accordionCard, expandedSections.sexual && styles.accordionCardExpanded]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => toggleSection("sexual")}
              style={[styles.accordionHeader, expandedSections.sexual && styles.accordionHeaderExpanded]}
            >
              <Text style={styles.accordionTitle}>SEXUAL WELLBEING FACTORS</Text>
              <Feather 
                name={expandedSections.sexual ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={COLORS.textTertiary} 
              />
            </TouchableOpacity>
            {expandedSections.sexual && (
              <View style={styles.accordionContent}>
                <Text style={styles.sectionSummary}>{report.sexual_health.summary}</Text>
                {report.sexual_health.relevant_factors?.length > 0 && (
                  <View style={styles.factorSubList}>
                    <Text style={styles.factorSubHeader}>RELEVANT VARIABLES</Text>
                    {report.sexual_health.relevant_factors.map((f, idx) => (
                      <Text key={idx} style={styles.factorText}>• {f}</Text>
                    ))}
                  </View>
                )}
                {report.sexual_health.areas_to_monitor?.length > 0 && (
                  <View style={styles.factorSubList}>
                    <Text style={styles.factorSubHeader}>AREAS TO MONITOR</Text>
                    {report.sexual_health.areas_to_monitor.map((f, idx) => (
                      <Text key={idx} style={styles.factorText}>• {f}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Accordion 6: Lifestyle profiling (Redesigned Grid Widgets) */}
        {report.lifestyle && (
          <View style={[styles.accordionCard, expandedSections.lifestyle && styles.accordionCardExpanded]}>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => toggleSection("lifestyle")}
              style={[styles.accordionHeader, expandedSections.lifestyle && styles.accordionHeaderExpanded]}
            >
              <Text style={styles.accordionTitle}>LIFESTYLE & EXPOSURES PROFILE</Text>
              <Feather 
                name={expandedSections.lifestyle ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={COLORS.textTertiary} 
              />
            </TouchableOpacity>
            {expandedSections.lifestyle && (
              <View style={styles.accordionContent}>
                <View style={styles.lifestyleGrid}>
                  {Object.entries(report.lifestyle).map(([key, val], idx) => {
                    const labelMap = {
                      sleep: "SLEEP & RECOVERY",
                      exercise: "PHYSICAL ACTIVITY",
                      diet: "DIET & NUTRITION",
                      heat_exposure: "HEAT EXPOSURE",
                      substance_use: "SUBSTANCE PROFILE",
                      environment: "ENVIRONMENTAL TOXINS"
                    };
                    const label = labelMap[key] || key.toUpperCase().replace("_", " ");
                    return (
                      <View key={idx} style={styles.lifestyleGridCard}>
                        <Text style={styles.lifestyleLabel}>{label}</Text>
                        <Text style={styles.lifestyleVal}>{val}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Accordion 7: Clinical Guidance */}
        <View style={[styles.accordionCard, expandedSections.guidance && styles.accordionCardExpanded]}>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => toggleSection("guidance")}
            style={[styles.accordionHeader, expandedSections.guidance && styles.accordionHeaderExpanded]}
          >
            <Text style={styles.accordionTitle}>CLINICAL DISCUSSION GUIDES</Text>
            <Feather 
              name={expandedSections.guidance ? "chevron-up" : "chevron-down"} 
              size={18} 
              color={COLORS.textTertiary} 
            />
          </TouchableOpacity>
          {expandedSections.guidance && (
            <View style={styles.accordionContent}>
              {report.questions_to_discuss_with_clinician?.length > 0 && (
                <View style={styles.guidanceSubBox}>
                  <Text style={styles.guidanceSubTitle}>QUESTIONS TO ASK YOUR DOCTOR</Text>
                  {report.questions_to_discuss_with_clinician.map((q, idx) => (
                    <Text key={idx} style={styles.guidanceText}>• "{q}"</Text>
                  ))}
                </View>
              )}

              {report.when_to_seek_professional_help?.length > 0 && (
                <View style={styles.guidanceSubBox}>
                  <Text style={styles.guidanceSubTitle}>WHEN TO SEEK PROFESSIONAL GUIDANCE</Text>
                  {report.when_to_seek_professional_help.map((h, idx) => (
                    <Text key={idx} style={styles.guidanceText}>• {h}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>CLINICAL DISCLAIMER</Text>
          <Text style={styles.disclaimerText}>{report.disclaimer}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    width: 40,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: SPACING.md,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gaugeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    marginRight: SPACING.lg,
  },
  gaugeSubtext: {
    fontFamily: "System",
    fontSize: 7,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 0.5,
    backgroundColor: "transparent",
  },
  gaugeValue: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 32,
    color: colors.nightBlue,
    lineHeight: 34,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  gaugeMax: {
    fontFamily: "System",
    fontSize: 7,
    fontWeight: "700",
    color: colors.textTertiary,
    backgroundColor: "transparent",
  },
  heroContent: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.5,
    marginBottom: 2,
    backgroundColor: "transparent",
  },
  heroTitle: {
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "700",
    color: colors.nightBlue,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  heroDescription: {
    fontFamily: "System",
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  accordionCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: "hidden",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  accordionCardExpanded: {
    borderColor: colors.border,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.white,
  },
  accordionHeaderExpanded: {
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "#fffdf9",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accordionTitle: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "800",
    color: colors.nightBlue,
    letterSpacing: 1.8,
    backgroundColor: "transparent",
  },
  accordionContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headline: {
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "700",
    color: colors.nightBlue,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    lineHeight: 22,
    backgroundColor: "transparent",
  },
  overviewText: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: SPACING.md,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: SPACING.md,
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    marginTop: SPACING.xs,
    borderColor: colors.border,
  },
  statusLabel: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  statusValue: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
    backgroundColor: "transparent",
  },
  findingItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: SPACING.md,
  },
  findingMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  findingTitle: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "700",
    color: colors.nightBlue,
    flex: 1,
    paddingRight: SPACING.sm,
    backgroundColor: "transparent",
  },
  findingBadge: {
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  findingBadgeText: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    backgroundColor: "transparent",
  },
  findingText: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  evidenceBox: {
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceLabel: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 0.8,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  evidenceText: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  actionItem: {
    flexDirection: "row",
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.marigold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
    marginTop: 2,
  },
  actionNumber: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
    backgroundColor: "transparent",
  },
  actionContent: {
    flex: 1,
  },
  actionArea: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 3,
    backgroundColor: "transparent",
  },
  actionText: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "700",
    color: colors.nightBlue,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  actionReason: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  sectionSummary: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginVertical: SPACING.md,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  factorSubList: {
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: SPACING.md,
  },
  factorSubHeader: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    backgroundColor: "transparent",
  },
  factorItem: {
    marginBottom: SPACING.sm,
  },
  factorTitle: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: colors.nightBlue,
    marginBottom: 2,
    backgroundColor: "transparent",
  },
  factorImpact: {
    fontFamily: "System",
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  guidanceCard: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  guidanceTextContainer: {
    flex: 1,
  },
  guidancePrompt: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 2,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  lifestyleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  lifestyleGridCard: {
    width: "47%",
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    borderWidth: 1.2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: SPACING.md,
    minHeight: 80,
  },
  lifestyleLabel: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  lifestyleVal: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.nightBlue,
    lineHeight: 16,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  guidanceSubBox: {
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#fffdf9",
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: SPACING.md,
  },
  guidanceSubTitle: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
    backgroundColor: "transparent",
  },
  guidanceText: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.nightBlue,
    lineHeight: 18,
    marginBottom: SPACING.xs,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  disclaimerBox: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(8, 12, 22, 0.03)",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disclaimerTitle: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
    backgroundColor: "transparent",
  },
  disclaimerText: {
    fontFamily: "System",
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    backgroundColor: "transparent",
  },
});
