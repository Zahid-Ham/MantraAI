import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { useRouter, Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { usePreferences } from "../../context/PreferencesContext";
import { SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";
import TricolorBar from "../../components/TricolorBar";
import IndianBackground from "../../components/IndianBackground";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { colors, isDarkMode, setIsDarkMode } = usePreferences();

  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setError(null);
    setSuccess(false);
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email.trim());
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error("Password reset failure:", err);
      const errMsg = err.message || "";
      if (errMsg.includes("auth/user-not-found")) {
        setError("No account was found with this email address.");
      } else if (errMsg.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(errMsg.replace("Firebase: ", "") || "Failed to request password reset. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = createStyles(colors, isDarkMode);

  return (
    <IndianBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Floating Theme Toggle Switch */}
      <TouchableOpacity 
        style={styles.themeToggle} 
        onPress={() => setIsDarkMode(!isDarkMode)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Toggle Theme"
      >
        <Feather name={isDarkMode ? "sun" : "moon"} size={20} color={colors.nightBlue} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <BrandHeader subtitle="private reproductive health companion" />
        </View>

        <View style={styles.formCard}>
          {/* Top Tricolor Strip */}
          <TricolorBar style={styles.cardTricolor} />

          <Text style={styles.title}>Reset Password.</Text>
          <Text style={styles.subtitle}>Enter your email address and we'll send you a link to reset your password.</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                Reset instructions have been sent to your email. Please check your inbox (and spam folder).
              </Text>
            </View>
          )}

          {!success && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@domain.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>
          )}

          {!success ? (
            <PrimaryButton
              title="SEND RESET LINK"
              onPress={handleReset}
              loading={submitting}
              style={styles.resetBtn}
            />
          ) : (
            <PrimaryButton
              title="RETURN TO LOG IN"
              onPress={() => router.push("/(auth)/login")}
              style={styles.resetBtn}
            />
          )}

          <View style={styles.backPrompt}>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.linkText}>Back to login</Text>
              </TouchableOpacity>
            </Link>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </IndianBackground>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  themeToggle: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 30,
    right: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.04,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  headerContainer: {
    marginBottom: SPACING.xl,
    marginTop: 40,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: SPACING.xl,
    overflow: "hidden",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDarkMode ? 0.2 : 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTricolor: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 32,
    color: colors.nightBlue,
    marginTop: 8,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 18,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.05)",
    borderColor: "rgba(220, 38, 38, 0.15)",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontFamily: "System",
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "600",
  },
  successBox: {
    backgroundColor: "rgba(6, 95, 70, 0.05)",
    borderColor: "rgba(6, 95, 70, 0.15)",
    borderWidth: 1.5,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successText: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.ashokaGreen,
    fontWeight: "600",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.cream,
    paddingHorizontal: SPACING.md,
    fontFamily: "System",
    fontSize: 14,
    color: colors.nightBlue,
  },
  resetBtn: {
    marginTop: SPACING.md,
    height: 50,
  },
  backPrompt: {
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  linkText: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: colors.nightBlue,
    textDecorationLine: "underline",
  },
});
