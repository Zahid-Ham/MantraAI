import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { usePreferences } from "../context/PreferencesContext";
import { SPACING } from "../constants/theme";
import PrimaryButton from "../components/PrimaryButton";
import IndianBackground from "../components/IndianBackground";

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, loading } = useAuth();
  const { colors, isDarkMode, setIsDarkMode } = usePreferences();

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Pillars Pulse Micro-Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Redirect if authenticated
    if (!loading && isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Entrance Anim
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      })
    ]).start();

    // Loop Pulse Anim
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const styles = createStyles(colors, isDarkMode);

  if (loading || isAuthenticated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>SECURE LOG IN...</Text>
      </View>
    );
  }

  return (
    <IndianBackground>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
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

        <Animated.View 
          style={[
            styles.content, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Tricolor Ribbon Badge */}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>🇮🇳 INDIA'S PIONEER SECURE HEALTH PLATFORM</Text>
          </View>

          {/* Brand Identity */}
          <View style={styles.headerGroup}>
            <View style={styles.brandLogoRow}>
              <MaterialCommunityIcons 
                name="dharmachakra" 
                size={26} 
                color={isDarkMode ? "#60a5fa" : "#000080"} 
              />
              <View style={styles.brandTitleContainer}>
                <Text style={[styles.brandTitle, { color: "#FF9933" }]}>MAN</Text>
                <Text style={[styles.brandTitle, { color: colors.nightBlue }]}>TRA</Text>
                <Text style={[styles.brandTitle, { color: "#128807" }]}>.AI</Text>
              </View>
            </View>
            <Text style={styles.brandSubtitle}>PRIVATE MEN'S HEALTH INTELLIGENCE</Text>
          </View>

          {/* Hindi Motto */}
          <Text style={styles.mottoText}>गोपनीयता • प्रमाण • स्वास्थ्य</Text>

          {/* Revolutionary Mission Slogan Statement */}
          <Text style={styles.revolutionTagline}>
            A healthcare social impact revolution breaking the silence on male reproductive wellness in Bharat. Secure, HIPAA-aware, 100% stigma-free clinical screening.
          </Text>

          {/* Core Pillars of the Revolution */}
          <View style={styles.pillarsContainer}>
            <View style={styles.pillarCard}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Feather name="shield" size={18} color="#FF9933" />
              </Animated.View>
              <Text style={styles.pillarTitle}>STIGMA-FREE PRIVACY</Text>
              <Text style={styles.pillarDesc}>100% anonymous screening.</Text>
            </View>
            <View style={styles.pillarCard}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Feather name="activity" size={18} color="#c5a059" />
              </Animated.View>
              <Text style={styles.pillarTitle}>MALE WELLNESS</Text>
              <Text style={styles.pillarDesc}>Empowering diagnostics.</Text>
            </View>
            <View style={styles.pillarCard}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Feather name="users" size={18} color="#128807" />
              </Animated.View>
              <Text style={styles.pillarTitle}>SOCIAL IMPACT</Text>
              <Text style={styles.pillarDesc}>National change for Bharat.</Text>
            </View>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionGroup}>
            <PrimaryButton
              title="SECURE CLIENT LOGIN"
              variant="orange"
              onPress={() => router.push("/(auth)/login")}
              style={styles.primaryBtn}
            />
            <PrimaryButton
              title="CREATE CLINICAL ACCOUNT"
              variant="secondary"
              onPress={() => router.push("/(auth)/signup")}
              style={styles.secondaryBtn}
            />
          </View>
        </Animated.View>

        <Text style={styles.footer}>MADE WITH PRIDE IN INDIA • BHAROSA & SURAKSHA</Text>
      </View>
    </IndianBackground>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.xl,
    paddingTop: Platform.OS === "ios" ? 80 : 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
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
  content: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: SPACING.sm,
    marginTop: 40,
    alignItems: "center",
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isDarkMode ? "#101626" : "#f1f5f9",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: SPACING.lg,
  },
  badgeText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 0.8,
  },
  headerGroup: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  brandLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(197, 160, 89, 0.08)",
    borderColor: "#c5a059",
    borderWidth: 1.5,
    borderRadius: 36,
    paddingVertical: 6,
    paddingHorizontal: 22,
    alignSelf: "center",
    shadowColor: "#c5a059",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: SPACING.md,
  },
  brandTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 44,
    letterSpacing: 1.5,
  },
  brandSubtitle: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 2.2,
  },
  mottoText: {
    fontFamily: "InstrumentSerif_400Regular_Italic",
    fontSize: 22,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
    marginBottom: SPACING.md,
    opacity: 0.95,
  },
  revolutionTagline: {
    fontFamily: "System",
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    fontWeight: "500",
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    opacity: 0.9,
  },
  pillarsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: SPACING.xxl,
    gap: 6,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.2 : 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  pillarTitle: {
    fontFamily: "System",
    fontSize: 8,
    fontWeight: "800",
    color: colors.nightBlue,
    marginTop: 6,
    marginBottom: 4,
    textAlign: "center",
  },
  pillarDesc: {
    fontFamily: "System",
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 11,
    fontWeight: "500",
  },
  actionGroup: {
    width: "100%",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryBtn: {
    width: "100%",
    height: 52,
  },
  secondaryBtn: {
    width: "100%",
    height: 52,
  },
  footer: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 2,
  },
});
