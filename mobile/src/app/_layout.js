import React from "react";
import { useFonts, InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../context/AuthContext";
import { AssessmentProvider } from "../context/AssessmentContext";
import { PreferencesProvider } from "../context/PreferencesContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep native splash screen visible until custom splash is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  React.useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <AssessmentProvider>
            <Slot />
          </AssessmentProvider>
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
