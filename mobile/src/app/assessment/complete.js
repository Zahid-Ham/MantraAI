import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";

export default function AssessmentComplete() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Session ID

  const handleViewReport = () => {
    if (id) {
      router.replace(`/report/${id}`);
    } else {
      router.replace("/(tabs)/reports");
    }
  };

  const handleExploreLearning = () => {
    router.replace("/(tabs)/learn");
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <BrandHeader />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="check" size={32} color={COLORS.ashokaGreen} />
          </View>
          
          <Text style={styles.title}>ASSESSMENT COMPLETE</Text>
          <Text style={styles.subtitle}>
            Your responses have been securely recorded and compiled into your personal health dossier.
          </Text>

          <View style={styles.actions}>
            <PrimaryButton
              title="VIEW YOUR INSIGHTS"
              variant="orange"
              onPress={handleViewReport}
              style={styles.actionBtn}
            />
            <PrimaryButton
              title="EXPLORE RECOMMENDED LEARNING"
              variant="secondary"
              onPress={handleExploreLearning}
              style={styles.actionBtn}
            />
          </View>
        </View>

        <Text style={styles.securityNote}>
          🔒 End-to-end HIPAA compliant database isolation
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(6, 95, 70, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(6, 95, 70, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  title: {
    fontFamily: "System",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.nightBlue,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  actions: {
    width: "100%",
    gap: SPACING.sm,
  },
  actionBtn: {
    width: "100%",
  },
  securityNote: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "600",
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
});
