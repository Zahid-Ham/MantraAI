import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { COLORS, SPACING } from "../constants/theme";

export default function Splash() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  
  // Fade in animation for text
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (loading) return;

    // Show splash screen for 1.8 seconds, then redirect
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/(tabs)/home");
      } else {
        router.replace("/(auth)/login");
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [isAuthenticated, loading]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.brandTitle}>MANTRA.AI</Text>
        <View style={styles.separator} />
        <Text style={styles.tagline}>PRIVATE.</Text>
        <Text style={styles.tagline}>EVIDENCE-AWARE.</Text>
        <Text style={styles.tagline}>MEN'S HEALTH.</Text>
      </Animated.View>
      
      <Text style={styles.footer}>MADE IN INDIA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.nightDark,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  content: {
    alignItems: "center",
  },
  brandTitle: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 48,
    color: COLORS.cream,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  separator: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.marigold,
    marginBottom: SPACING.lg,
  },
  tagline: {
    fontFamily: "System",
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.cream,
    letterSpacing: 2,
    lineHeight: 18,
    opacity: 0.8,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: SPACING.xxl,
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.darkTextTertiary,
    letterSpacing: 2,
  },
});
