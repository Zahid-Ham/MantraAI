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

export default function Login() {
  const router = useRouter();
  const { loginWithEmail } = useAuth();
  const { colors, isDarkMode, setIsDarkMode } = usePreferences();

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
              placeholderTextColor={colors.textTertiary}
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
              placeholderTextColor={colors.textTertiary}
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
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  forgotText: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 0.5,
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
  loginBtn: {
    marginTop: SPACING.md,
    height: 50,
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
    color: colors.textSecondary,
    fontWeight: "500",
  },
  linkText: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "700",
    color: colors.nightBlue,
    textDecorationLine: "underline",
  },
});
