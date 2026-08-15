import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS, SPACING } from "../constants/theme";
import { usePreferences } from "../context/PreferencesContext";

export default function ReportCard({ date, status, id, onPress }) {
  const { colors, language } = usePreferences();
  
  const styles = createStyles(colors);

  // Map status category to color scheme
  const getStatusConfig = (statusStr) => {
    switch (statusStr?.toLowerCase()) {
      case "stable":
      case "mostly stable":
        return {
          textColor: colors.ashokaGreen,
          bgColor: "rgba(6, 95, 70, 0.05)",
          borderColor: "rgba(6, 95, 70, 0.15)",
        };
      case "worth monitoring":
        return {
          textColor: colors.marigold,
          bgColor: "rgba(217, 119, 6, 0.05)",
          borderColor: "rgba(217, 119, 6, 0.15)",
        };
      case "several areas need attention":
      case "attention":
        return {
          textColor: "#dc2626", // soft red
          bgColor: "rgba(220, 38, 38, 0.05)",
          borderColor: "rgba(220, 38, 38, 0.15)",
        };
      default:
        return {
          textColor: colors.textSecondary,
          bgColor: colors.creamDark,
          borderColor: colors.border,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  // Format date string to readable Indian-first/English format
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.8} 
      style={styles.card}
    >
      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.title}>{language === "hi" ? "कल्याण रिपोर्ट" : "WELLNESS REPORT"}</Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
        
        <View 
          style={[
            styles.badge, 
            { 
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.borderColor 
            }
          ]}
        >
          <Text style={[styles.badgeText, { color: statusConfig.textColor }]}>
            {status?.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Feather name="chevron-right" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.nightBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  content: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  meta: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    color: colors.textTertiary,
    letterSpacing: 1.8,
    marginBottom: 2,
    backgroundColor: "transparent",
  },
  date: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "700",
    color: colors.nightBlue,
    backgroundColor: "transparent",
  },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: "System",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    backgroundColor: "transparent",
  },
});
