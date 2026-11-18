/**
 * MajDur Design System Tokens
 * Developer: Harsh Singh
 * Platform: MajDur (India's Premier Workforce & Skilled Services Marketplace)
 */

export const colors = {
  // Brand Primary & Accent
  gold: {
    50: "#FFFDF0",
    100: "#FFF9D2",
    200: "#FDF0A5",
    300: "#FBE677",
    400: "#E5C34D",
    500: "#D4AF37", // Primary Gold Accent
    600: "#C5A028", // Hover Gold
    700: "#A3821C",
    800: "#7F6413",
    900: "#5A450B",
  },
  // Dark Theme Surfaces
  dark: {
    bg: "#101010",         // App root background
    card: "#181818",       // Cards, modals, containers
    elevated: "#222222",   // Dropdowns, hover states, floating menus
    border: "#2A2A2A",     // Standard borders
    borderSubtle: "#1F1F1F",
    textPrimary: "#FFFFFF",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
  },
  // Light Theme Surfaces
  light: {
    bg: "#F8FAFC",
    card: "#FFFFFF",
    elevated: "#F1F5F9",
    border: "#E2E8F0",
    borderSubtle: "#F1F5F9",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
  },
  // Semantic Feedback
  semantic: {
    success: "#16A34A",
    successBg: "rgba(22, 163, 74, 0.12)",
    warning: "#F59E0B",
    warningBg: "rgba(245, 158, 11, 0.12)",
    danger: "#DC2626",
    dangerBg: "rgba(220, 38, 38, 0.12)",
    info: "#2563EB",
    infoBg: "rgba(37, 99, 235, 0.12)",
  },
  // User Roles
  roles: {
    customer: "#38BDF8", // Sky blue
    worker: "#D4AF37",   // Gold
    contractor: "#A855F7", // Purple
    admin: "#EF4444",    // Red
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  fontSize: {
    xs: ["0.75rem", { lineHeight: "1rem" }],       // 12px
    sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14px
    base: ["1rem", { lineHeight: "1.5rem" }],       // 16px
    lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
    xl: ["1.25rem", { lineHeight: "1.75rem" }],     // 20px
    "2xl": ["1.5rem", { lineHeight: "2rem" }],     // 24px
    "3xl": ["1.875rem", { lineHeight: "2.25rem" }],// 30px
    "4xl": ["2.25rem", { lineHeight: "2.5rem" }],   // 36px
    "5xl": ["3rem", { lineHeight: "1.15" }],       // 48px
    "6xl": ["3.75rem", { lineHeight: "1.1" }],     // 60px
    "7xl": ["4.5rem", { lineHeight: "1.05" }],     // 72px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
    black: "900",
  },
} as const;

export const radius = {
  none: "0px",
  sm: "0.25rem",    // 4px
  md: "0.375rem",   // 6px
  lg: "0.5rem",     // 8px
  xl: "0.75rem",    // 12px
  "2xl": "1rem",    // 16px
  "3xl": "1.5rem",  // 24px
  full: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
  gold: "0 4px 20px -2px rgba(212, 175, 55, 0.25)",
  goldLg: "0 10px 30px -4px rgba(212, 175, 55, 0.35)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  drawer: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;


export const DESIGN_TOKENS = {
  colors,
  typography,
  radius,
  shadows,
  breakpoints,
  zIndex,
} as const;

export default DESIGN_TOKENS;
