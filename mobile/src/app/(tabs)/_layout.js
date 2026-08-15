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
          bottom: Platform.OS === "ios" ? 24 : 16,
          left: 18,
          right: 18,
          borderRadius: 20,
          height: 66,
          backgroundColor: colors.white,
          borderWidth: 1.5,
          borderColor: colors.border,
          shadowColor: colors.nightBlue,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.3 : 0.05,
          shadowRadius: 10,
          elevation: 6,
          paddingBottom: Platform.OS === "ios" ? 20 : 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontFamily: "System",
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.5,
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
                size={18} 
                color={colors.cream} 
              />
            </View>
          ),
          tabBarLabelStyle: {
            fontFamily: "System",
            fontSize: 10,
            fontWeight: "700",
            color: colors.marigold,
            letterSpacing: 0.5,
          }
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.marigold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  assessFocused: {
    backgroundColor: colors.marigold,
  },
  assessUnfocused: {
    backgroundColor: colors.nightBlue,
  },
});
