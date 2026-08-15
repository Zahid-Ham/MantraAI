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
import { useAuth } from "../../context/AuthContext";
import { COLORS, SPACING } from "../../constants/theme";
import BrandHeader from "../../components/BrandHeader";
import PrimaryButton from "../../components/PrimaryButton";

export default function ForgotPassword() {
  const router = useRouter();
  const { resetPassword } = useAuth();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <BrandHeader subtitle="private reproductive health companion" />
        </View>

        <View style={styles.formCard}>
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
                placeholderTextColor={COLORS.textTertiary}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerContainer: {
    marginBottom: SPACING.xl,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.xl,
  },
  title: {
    fontFamily: "System",
    fontSize: 22,
    fontWeight: "300",
    color: COLORS.nightBlue,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "System",
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.05)",
    borderColor: "rgba(220, 38, 38, 0.15)",
    borderWidth: 1,
    borderRadius: 4,
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
    borderWidth: 1,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  successText: {
    fontFamily: "System",
    fontSize: 12,
    color: COLORS.ashokaGreen,
    fontWeight: "600",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cream,
    paddingHorizontal: SPACING.md,
    fontFamily: "System",
    fontSize: 14,
    color: COLORS.nightBlue,
  },
  resetBtn: {
    marginTop: SPACING.md,
  },
  backPrompt: {
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  linkText: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.nightBlue,
    textDecorationLine: "underline",
  },
});
