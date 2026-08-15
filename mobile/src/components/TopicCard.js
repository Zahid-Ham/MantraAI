import React, { useRef } from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function TopicCard({ title, category, readTime, description, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { colors } = usePreferences();
  const styles = createStyles(colors);

  // Format category to readable text
  const formatCategory = (cat) => {
    return cat
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  return (
    <TouchableWithoutFeedback 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.category}>{formatCategory(category).toUpperCase()}</Text>
          <View style={styles.meta}>
            <Feather name="clock" size={10} color={colors.textTertiary} style={styles.clockIcon} />
            <Text style={styles.readTime}>{readTime}</Text>
          </View>
        </View>
        
        <Text style={styles.title}>{title}</Text>
        
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.actionText}>Read Article</Text>
          <Feather name="arrow-right" size={14} color={colors.marigold} />
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  category: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.marigold,
    letterSpacing: 1.2,
    backgroundColor: "transparent",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockIcon: {
    marginRight: 4,
  },
  readTime: {
    fontFamily: "System",
    fontSize: 9,
    color: colors.textTertiary,
    fontWeight: "600",
    backgroundColor: "transparent",
  },
  title: {
    fontFamily: "InstrumentSerif_400Regular",
    fontSize: 22,
    color: colors.nightBlue,
    marginBottom: SPACING.xs,
    lineHeight: 24,
    backgroundColor: "transparent",
  },
  description: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
    fontWeight: "500",
    backgroundColor: "transparent",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: SPACING.sm,
  },
  actionText: {
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "700",
    color: colors.nightBlue,
    backgroundColor: "transparent",
  },
});
