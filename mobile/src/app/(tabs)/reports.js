import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import ReportCard from "../../components/ReportCard";
import EmptyState from "../../components/EmptyState";
import { apiRequest } from "../../services/api";

export default function Reports() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { colors, language } = usePreferences();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const styles = createStyles(colors);

  const fetchReports = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest("/api/v1/assessments");
      // Filter out only completed assessments
      const completedSessions = data.filter(s => s.status === "COMPLETED");
      
      // Fetch details/results for each completed session to map overall_category
      const resolvedReports = await Promise.all(
        completedSessions.map(async (session) => {
          try {
            const results = await apiRequest(`/api/v1/assessments/${session.id}/results`);
            return {
              id: session.id,
              date: session.completed_at || session.started_at,
              status: results.overall_category || "Completed"
            };
          } catch {
            return {
              id: session.id,
              date: session.completed_at || session.started_at,
              status: "Completed"
            };
          }
        })
      );
      
      setReports(resolvedReports);
    } catch (err) {
      console.error("Failed to load reports history:", err);
      setError("Unable to load your reports history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleViewReport = (id) => {
    router.push(`/report/${id}`);
  };

  const handleStartAssessment = () => {
    router.push("/(tabs)/assessment");
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.header}>
        <BrandHeader subtitle={language === "hi" ? "मेरा चिकित्सा इतिहास" : "my clinical history"} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.marigold} />
        }
      >
        {loading && !refreshing && reports.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.marigold} />
          </View>
        ) : error ? (
          <EmptyState
            icon="alert-circle"
            title={language === "hi" ? "रिपोर्ट लोड करने में विफल" : "Failed to load reports"}
            description={error}
            actionTitle={language === "hi" ? "पुनः प्रयास करें" : "Try Again"}
            onActionPress={fetchReports}
          />
        ) : reports.length > 0 ? (
          <View style={styles.list}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                id={report.id}
                date={report.date}
                status={report.status}
                onPress={() => handleViewReport(report.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="file-text"
            title={language === "hi" ? "अभी तक कोई रिपोर्ट तैयार नहीं है" : "No reports compiled yet"}
            description={language === "hi" ? "अपनी व्यक्तिगत कल्याण रिपोर्ट प्राप्त करने के लिए अपना पहला स्वास्थ्य आकलन पूरा करें।" : "Complete your first health assessment to generate your personalized wellness report."}
            actionTitle={language === "hi" ? "आकलन शुरू करें" : "Start Assessment"}
            onActionPress={handleStartAssessment}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  list: {
    marginTop: SPACING.md,
  },
});
