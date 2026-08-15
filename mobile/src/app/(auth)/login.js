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

export default function Login() {
  const router = useRouter();
  const { loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (err) {
      console.error("Login failure:", err);
      // Clean up Firebase error message
      const errMsg = err.message || "";
      if (errMsg.includes("auth/invalid-credential") || errMsg.includes("auth/user-not-found") || errMsg.includes("auth/wrong-password")) {
        setError("Invalid email or password.");
      } else if (errMsg.includes("auth/invalid-email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(errMsg.replace("Firebase: ", "") || "Failed to log in. Please try again.");
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
          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Log in to access your secure profile and clinical reports.</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PASSWORD</Text>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity activeOpacity={0.6}>
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={COLORS.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
          </View>

          <PrimaryButton
            title="LOG IN"
            onPress={handleLogin}
            loading={submitting}
            style={styles.loginBtn}
          />

          <View style={styles.signupPrompt}>
            <Text style={styles.promptText}>New to MantraAI? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.linkText}>Create an account</Text>
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
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  forgotText: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.marigold,
    letterSpacing: 0.5,
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
  loginBtn: {
    marginTop: SPACING.md,
  },
  signupPrompt: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.xl,
  },
  promptText: {
    fontFamily: "System",
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.nightBlue,
    textDecorationLine: "underline",
  },
});
