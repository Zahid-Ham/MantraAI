import React from "react";
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useAssessment } from "../../context/AssessmentContext";
import { usePreferences } from "../../context/PreferencesContext";
import { SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearLocalDraft } = useAssessment();
  const { isDarkMode, setIsDarkMode, language, setLanguage, t, colors } = usePreferences();
  
  const styles = createStyles(colors);

  const handleLogout = async () => {
    Alert.alert(
      t("confirmLogout"),
      t("confirmLogoutMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("logout"), 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch (e) {
              Alert.alert("Logout Error", "Unable to log out. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleClearData = async () => {
    Alert.alert(
      t("clearDrafts"),
      t("clearDraftsMsg"),
      [
        { text: t("cancel"), style: "cancel" },
        { 
          text: t("clearDrafts"), 
          style: "destructive",
          onPress: async () => {
            await clearLocalDraft();
            Alert.alert("Success", t("clearSuccess"));
          }
        }
      ]
    );
  };

  const authMethod = user?.providerData?.[0]?.providerId === "google.com" ? "Google" : "Email & Password";

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandHeader subtitle={t("secureGateway")} />
        
        {/* User Account Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>{t("secureAccount")}</Text>
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>{t("emailAddress")}</Text>
            <Text style={styles.accountValue}>{user?.email || "Not Available"}</Text>
          </View>
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>{t("authMethod")}</Text>
            <Text style={styles.accountValue}>{authMethod}</Text>
          </View>
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>{t("verificationId")}</Text>
            <Text style={[styles.accountValue, styles.uid]} numberOfLines={1}>
              {user?.uid || "N/A"}
            </Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>{t("preferences")}</Text>
          
          <View style={styles.prefRow}>
            <View style={styles.prefLabelContainer}>
              <Feather name="moon" size={16} color={colors.nightBlue} style={styles.prefIcon} />
              <Text style={styles.prefLabel}>{t("darkMode")}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={setIsDarkMode}
              trackColor={{ false: colors.border, true: colors.marigold }}
              thumbColor={colors.cream}
            />
          </View>

          <View style={styles.prefRow}>
            <View style={styles.prefLabelContainer}>
              <Feather name="globe" size={16} color={colors.nightBlue} style={styles.prefIcon} />
              <Text style={styles.prefLabel}>{t("hindiLang")}</Text>
            </View>
            <Switch
              value={language === "hi"}
              onValueChange={(val) => setLanguage(val ? "hi" : "en")}
              trackColor={{ false: colors.border, true: colors.marigold }}
              thumbColor={colors.cream}
            />
          </View>
        </View>

        {/* Security & Data Privacy */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>{t("privacySecurity")}</Text>
          <Text style={styles.privacyNote}>
            {t("privacyNote")}
          </Text>
          
          <TouchableOpacity 
            style={styles.dataButton} 
            activeOpacity={0.7}
            onPress={handleClearData}
          >
            <Feather name="trash-2" size={14} color="#dc2626" style={styles.prefIcon} />
            <Text style={styles.dataButtonText}>{t("clearDrafts")}</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.logoutContainer}>
          <PrimaryButton
            title={t("logout")}
            variant="secondary"
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
          <Text style={styles.version}>MANTRA.AI MOBILE • VERSION 1.0.0 (BETA)</Text>
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
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionHeader: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.8,
    marginBottom: SPACING.md,
    backgroundColor: "transparent",
  },
  accountItem: {
    marginBottom: SPACING.md,
  },
  accountLabel: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  accountValue: {
    fontFamily: "System",
    fontSize: 14,
    color: colors.nightBlue,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  uid: {
    fontSize: 11,
    fontFamily: "System",
    color: colors.textTertiary,
    backgroundColor: "transparent",
  },
  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  prefLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  prefIcon: {
    marginRight: SPACING.sm,
  },
  prefLabel: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.nightBlue,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  privacyNote: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  dataButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  dataButtonText: {
    fontFamily: "System",
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "700",
    backgroundColor: "transparent",
  },
  logoutContainer: {
    marginTop: SPACING.xl,
    alignItems: "center",
  },
  logoutBtn: {
    width: "100%",
  },
  version: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.8,
    marginTop: SPACING.lg,
    backgroundColor: "transparent",
  },
});
