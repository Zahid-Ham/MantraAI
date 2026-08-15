import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "../utils/storage";
import { COLORS } from "../constants/theme";

const PreferencesContext = createContext(null);

const DARK_MODE_KEY = "mantra_pref_dark_mode";
const LANG_KEY = "mantra_pref_language";

const translations = {
  en: {
    secureGateway: "secure gateway",
    secureAccount: "SECURE ACCOUNT",
    emailAddress: "EMAIL ADDRESS",
    authMethod: "AUTHENTICATION METHOD",
    verificationId: "VERIFICATION ID",
    preferences: "PREFERENCES",
    darkMode: "Dark Mode",
    hindiLang: "Hindi Language (हिंदी)",
    privacySecurity: "PRIVACY & SECURITY",
    privacyNote: "MantraAI maintains end-to-end cryptographic shielding. Sensitive sexual and reproductive health answers are never logged locally or printed in debug consoles.",
    clearDrafts: "Clear Assessment Drafts",
    logout: "LOG OUT OF SECURE PROFILE",
    confirmLogout: "Confirm Log Out",
    confirmLogoutMsg: "Are you sure you want to log out of your secure profile?",
    clearSuccess: "Local drafts have been cleared.",
    cancel: "CANCEL",
    save: "SAVE",
    back: "BACK",
    next: "NEXT",
    home: "HOME",
    learn: "LEARN",
    assess: "ASSESS",
    reports: "REPORTS",
    profile: "PROFILE",
    yes: "Yes",
    no: "No",
    readyToSubmit: "Your responses are ready to be assessed.",
    submitAssessment: "SUBMIT ASSESSMENT",
    clearDraftsMsg: "This will erase any local assessment drafts from this device. Completed reports on the server will not be deleted.",
  },
  hi: {
    secureGateway: "सुरक्षित द्वार",
    secureAccount: "सुरक्षित खाता",
    emailAddress: "ईमेल पता",
    authMethod: "प्रमाणीकरण विधि",
    verificationId: "सत्यापन आईडी",
    preferences: "प्राथमिकताएं",
    darkMode: "डार्क मोड",
    hindiLang: "हिंदी भाषा (Hindi)",
    privacySecurity: "गोपनीयता और सुरक्षा",
    privacyNote: "MantraAI एंड-टू-एंड क्रिप्टोग्राफिक सुरक्षा बनाए रखता है। संवेदनशील यौन और प्रजनन स्वास्थ्य उत्तर कभी भी स्थानीय रूप से सहेजे या डीबग कंसोल में मुद्रित नहीं किए जाते हैं।",
    clearDrafts: "आकलन ड्राफ्ट हटाएं",
    logout: "सुरक्षित प्रोफाइल से लॉग आउट करें",
    confirmLogout: "लॉग आउट की पुष्टि करें",
    confirmLogoutMsg: "क्या आप वाकई अपने सुरक्षित प्रोफाइल से लॉग आउट करना चाहते हैं?",
    clearSuccess: "स्थानीय आकलन ड्राफ्ट हटा दिए गए हैं।",
    cancel: "रद्द करें",
    save: "सहेजें",
    back: "पीछे",
    next: "आगे",
    home: "होम",
    learn: "सीखें",
    assess: "आकलन",
    reports: "रिपोर्ट",
    profile: "प्रोफाइल",
    yes: "हाँ",
    no: "नहीं",
    readyToSubmit: "आपके उत्तर मूल्यांकन के लिए तैयार हैं।",
    submitAssessment: "आकलन सबमिट करें",
    clearDraftsMsg: "यह इस डिवाइस से किसी भी स्थानीय आकलन ड्राफ्ट को मिटा देगा। सर्वर पर पूरी हो चुकी रिपोर्टें डिलीट नहीं होंगी।",
  }
};

export function PreferencesProvider({ children }) {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [language, setLanguageState] = useState("en");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const storedDarkMode = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (storedDarkMode !== null) {
          setIsDarkModeState(storedDarkMode === "true");
        }
        const storedLang = await AsyncStorage.getItem(LANG_KEY);
        if (storedLang !== null) {
          setLanguageState(storedLang);
        }
      } catch (e) {
        console.warn("Failed to load preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    loadPrefs();
  }, []);

  const setIsDarkMode = async (value) => {
    setIsDarkModeState(value);
    try {
      await AsyncStorage.setItem(DARK_MODE_KEY, value ? "true" : "false");
    } catch (e) {
      console.warn("Failed to save dark mode preference:", e);
    }
  };

  const setLanguage = async (value) => {
    setLanguageState(value);
    try {
      await AsyncStorage.setItem(LANG_KEY, value);
    } catch (e) {
      console.warn("Failed to save language preference:", e);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  const colors = isDarkMode ? {
    background: COLORS.darkBackground,
    surface: COLORS.darkSurface,
    textPrimary: COLORS.darkTextPrimary,
    textSecondary: COLORS.darkTextSecondary,
    textTertiary: COLORS.darkTextTertiary,
    border: COLORS.darkBorder,
    white: COLORS.darkSurface,
    nightBlue: COLORS.darkTextPrimary,
    cream: COLORS.darkBackground,
    creamDark: COLORS.darkSurface,
    marigold: COLORS.marigold,
    ashokaGreen: COLORS.ashokaGreenLight,
  } : COLORS;

  const value = {
    isDarkMode,
    setIsDarkMode,
    language,
    setLanguage,
    t,
    colors,
    loading
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
