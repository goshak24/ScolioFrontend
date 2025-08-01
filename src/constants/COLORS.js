// Dark theme colors - Gender-neutral, accessible, beautiful
const darkColors = {
  // Primary colors (Deep Indigo - professional and gender-neutral)
  primary: "#1e40af", // Blue-800 (main brand color)
  primaryLight: "#3b82f6", // Blue-500 (lighter variant)
  primaryDark: "#1e3a8a", // Blue-900 (darker variant)
  
  // Secondary colors (Teal - calming and neutral)
  secondary: "#0891b2", // Cyan-600 (secondary brand color)
  secondaryLight: "#06b6d4", // Cyan-500 (lighter variant)
  secondaryDark: "#0e7490", // Cyan-700 (darker variant)
  
  // Surface and background colors
  background: "#0f172a", // Slate-900 (main background)
  surface: "#1e293b", // Slate-800 (card backgrounds)
  surfaceVariant: "#334155", // Slate-700 (elevated surfaces)
  
  // Text colors
  onPrimary: "#ffffff", // White text on primary
  onSecondary: "#ffffff", // White text on secondary
  onBackground: "#f1f5f9", // Slate-100 (main text)
  onSurface: "#e2e8f0", // Slate-200 (secondary text)
  onSurfaceVariant: "#94a3b8", // Slate-400 (tertiary text)
  
  // Accent colors
  accent: "#f59e0b", // Amber-500 (warm accent)
  accentLight: "#fbbf24", // Amber-400 (lighter variant)
  success: "#10b981", // Emerald-500 (success states)
  warning: "#f59e0b", // Amber-500 (warning states)
  error: "#ef4444", // Red-500 (error states)
  
  // Gradient colors
  gradientStart: "#1e40af", // Primary
  gradientEnd: "#0891b2", // Secondary
  gradientAccent: ["#f59e0b", "#fb923c"], // Warm gradient
  
  // Legacy mappings (for backward compatibility)
  primaryPurple: "#1e40af",
  gradientPurple: "#1e40af",
  backgroundPurple: "#334155",
  gradientPink: "#0891b2",
  darkBackground: "#0f172a",
  lightPurple: "#3b82f6",
  lightGray: "#94a3b8",
  pinkButtons: "#0891b2",
  accentOrange: "#f59e0b",
  accentGreen: "#10b981",
  white: "#ffffff",
  cardDark: "#1e293b",
  red: "#ef4444",
  
  // Specific use cases
  workoutOption: "#1e293b",
  background: "#0f172a",
  text: "#f1f5f9",
  header: "#1e293b",
  button: "#0891b2",
  tabInactive: "#94a3b8",
  tabActiveStart: "#1e40af",
  tabActiveEnd: "#0891b2",
  badgeBackground: "#334155",
  progressBackground: "#1e293b",
  progressIndicatorStart: "#1e40af",
  progressIndicatorEnd: "#0891b2",
  flame: "#f59e0b",
  leaderboardFirst: "#fbbf24",
  leaderboardSecond: "#94a3b8",
  leaderboardThird: "#0891b2",
  leaderboardDefault: "#1e293b",
  timerBackground: "#1e293b",
  streakOrange: "#f59e0b"
};

// Export dark theme as default
export default darkColors;

 // Light theme colors - Gender-neutral, accessible, beautiful
const lightColors = {
  // Primary colors (Deep Indigo variants for light theme)
  primary: "#1d4ed8", // Blue-700 (main brand color)
  primaryLight: "#3b82f6", // Blue-500 (lighter variant)
  primaryDark: "#1e3a8a", // Blue-900 (darker variant)
  
  // Secondary colors (Teal variants for light theme)
  secondary: "#0e7490", // Cyan-700 (secondary brand color)
  secondaryLight: "#0891b2", // Cyan-600 (lighter variant)
  secondaryDark: "#155e75", // Cyan-800 (darker variant)
  
  // Surface and background colors
  background: "#ffffff", // White (main background)
  surface: "#f8fafc", // Slate-50 (card backgrounds)
  surfaceVariant: "#f1f5f9", // Slate-100 (elevated surfaces)
  
  // Text colors
  onPrimary: "#ffffff", // White text on primary
  onSecondary: "#ffffff", // White text on secondary
  onBackground: "#0f172a", // Slate-900 (main text)
  onSurface: "#1e293b", // Slate-800 (secondary text)
  onSurfaceVariant: "#64748b", // Slate-500 (tertiary text)
  
  // Accent colors
  accent: "#d97706", // Amber-600 (warm accent)
  accentLight: "#f59e0b", // Amber-500 (lighter variant)
  success: "#059669", // Emerald-600 (success states)
  warning: "#d97706", // Amber-600 (warning states)
  error: "#dc2626", // Red-600 (error states)
  
  // Gradient colors
  gradientStart: "#1d4ed8", // Primary
  gradientEnd: "#0e7490", // Secondary
  gradientAccent: ["#d97706", "#ea580c"], // Warm gradient
  
  // Legacy mappings (for backward compatibility)
  primaryPurple: "#1d4ed8",
  gradientPurple: "#1d4ed8",
  backgroundPurple: "#f1f5f9",
  gradientPink: "#0e7490",
  darkBackground: "#ffffff",
  lightPurple: "#3b82f6",
  lightGray: "#64748b",
  pinkButtons: "#0e7490",
  accentOrange: "#d97706",
  accentGreen: "#059669",
  white: "#0f172a",
  cardDark: "#f8fafc",
  red: "#dc2626",
  
  // Specific use cases
  workoutOption: "#f8fafc",
  background: "#ffffff",
  text: "#0f172a",
  header: "#f8fafc",
  button: "#0e7490",
  tabInactive: "#64748b",
  tabActiveStart: "#1d4ed8",
  tabActiveEnd: "#0e7490",
  badgeBackground: "#f1f5f9",
  progressBackground: "#f8fafc",
  progressIndicatorStart: "#1d4ed8",
  progressIndicatorEnd: "#0e7490",
  flame: "#d97706",
  leaderboardFirst: "#eab308",
  leaderboardSecond: "#94a3b8",
  leaderboardThird: "#0e7490",
  leaderboardDefault: "#f8fafc",
  timerBackground: "#f8fafc",
  streakOrange: "#d97706"
};

// Export light colors for theme switching
export { lightColors };