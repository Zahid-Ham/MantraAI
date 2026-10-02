import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Text, Dimensions } from "react-native";
import { usePreferences } from "../context/PreferencesContext";

const { width } = Dimensions.get("window");

export default function IndianBackground({ children }) {
  const { isDarkMode } = usePreferences();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 3 minutes for a smooth, slow Chakra rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 180000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 12 seconds breathing loop for the background glows
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const glowScale1 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.15],
  });
  const glowOpacity1 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  const glowScale2 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.15, 0.95],
  });
  const glowOpacity2 = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 0.4],
  });

  const { colors } = usePreferences();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Saffron Glowing Ambient Sphere (Top Right) */}
      <Animated.View 
        style={[
          styles.glowSphere,
          styles.saffronGlow,
          {
            opacity: glowOpacity1,
            transform: [{ scale: glowScale1 }]
          }
        ]}
        pointerEvents="none"
      />

      {/* Green Glowing Ambient Sphere (Bottom Left) */}
      <Animated.View 
        style={[
          styles.glowSphere,
          styles.greenGlow,
          {
            opacity: glowOpacity2,
            transform: [{ scale: glowScale2 }]
          }
        ]}
        pointerEvents="none"
      />

      {/* Rotating Ashoka Chakra Watermark */}
      <Animated.View 
        style={[
          styles.watermarkContainer, 
          { transform: [{ rotate }] }
        ]} 
        pointerEvents="none"
      >
        <Text style={[
          styles.watermarkText,
          { color: isDarkMode ? "rgba(255, 255, 255, 0.012)" : "rgba(0, 0, 128, 0.015)" }
        ]}>
          ☸
        </Text>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  glowSphere: {
    position: "absolute",
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: (width * 0.9) / 2,
  },
  saffronGlow: {
    top: "-15%",
    right: "-15%",
    backgroundColor: "rgba(255, 153, 51, 0.08)",
  },
  greenGlow: {
    bottom: "-15%",
    left: "-15%",
    backgroundColor: "rgba(18, 136, 7, 0.08)",
  },
  watermarkContainer: {
    position: "absolute",
    top: "28%",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 320,
    fontFamily: "System",
  },
});
