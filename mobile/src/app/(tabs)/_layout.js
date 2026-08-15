import React from "react";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePreferences } from "../../context/PreferencesContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors, t } = usePreferences();
  
  const styles = createStyles(colors);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.marigold,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: Platform.OS === "ios" ? 88 : (60 + Math.max(0, insets.bottom)),
          paddingBottom: Platform.OS === "ios" ? 30 : Math.max(10, insets.bottom),
          paddingTop: 10,
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
