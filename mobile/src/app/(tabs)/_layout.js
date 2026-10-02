import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "../../context/PreferencesContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, t, isDarkMode } = usePreferences();
  
  const styles = createStyles(colors);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.marigold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS === "ios" ? (insets.bottom > 0 ? insets.bottom : 24) : (insets.bottom > 0 ? insets.bottom + 12 : 16),
          left: 16,
          right: 16,
          borderRadius: 24,
          height: 74,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.border,
          shadowColor: colors.nightBlue,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.25 : 0.04,
          shadowRadius: 12,
          elevation: 8,
          paddingBottom: Platform.OS === "ios" ? 14 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontFamily: "System",
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 0.5,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t("learn"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: t("assess"),
          tabBarIcon: ({ color, focused }) => (
            <View 
              style={[
                styles.assessContainer,
                focused ? styles.assessFocused : styles.assessUnfocused
              ]}
            >
              <Feather 
                name="activity" 
                size={20} 
                color={colors.cream} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t("reports"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const createStyles = (colors) => StyleSheet.create({
  assessContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -8,
    ...Platform.select({
      ios: {
        shadowColor: colors.marigold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  assessFocused: {
    backgroundColor: colors.marigold,
    borderColor: colors.white,
    borderWidth: 1.5,
  },
  assessUnfocused: {
    backgroundColor: colors.nightBlue,
    borderColor: colors.white,
    borderWidth: 1.5,
  },
});
