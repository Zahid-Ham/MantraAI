export const COLORS = {
  // Brand Main Colors
  nightBlue: "#080c16",
  nightDark: "#05070f",
  cream: "#fbfaf7",
  creamDark: "#f5f3ee",
  marigold: "#d97706",
  marigoldLight: "#f59e0b",
  ashokaGreen: "#065f46",
  ashokaGreenLight: "#059669",

  // Semantic Colors
  background: "#fbfaf7",
  surface: "#f5f3ee",
  textPrimary: "#080c16",
  textSecondary: "rgba(8, 12, 22, 0.65)",
  textTertiary: "rgba(8, 12, 22, 0.4)",
  border: "rgba(8, 12, 22, 0.08)",
  white: "#ffffff",

  // Dark Mode Semantic Fallbacks
  darkBackground: "#05070f",
  darkSurface: "#080c16",
  darkTextPrimary: "#fbfaf7",
  darkTextSecondary: "rgba(251, 250, 247, 0.65)",
  darkTextTertiary: "rgba(251, 250, 247, 0.4)",
  darkBorder: "rgba(255, 255, 255, 0.1)",
};

export const FONTS = {
  // Use Instrument Serif for headlines
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
  // Use System sans-serif for UI elements
  sansRegular: "System",
  sansMedium: "System",
  sansBold: "System",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const SHADOWS = {
  subtle: {
    shadowColor: "#080c16",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: "#080c16",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
};
