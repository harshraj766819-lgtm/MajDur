import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // MajDur System Palette mapped to CSS variables
        majdur: {
          bg: "var(--background)",
          card: "var(--card-bg)",
          cardHover: "var(--card-hover)",
          border: "var(--border-color)",
          borderSubtle: "var(--border-subtle)",
          textPrimary: "var(--foreground)",
          textSecondary: "var(--text-muted)",
          gold: "#D4AF37",
          goldHover: "#C5A028",
          goldLight: "#F3E5AB",
          goldDark: "#A3821C",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          info: "#2563EB",
          // Role Colors
          customer: "#38BDF8",
          worker: "#D4AF37",
          contractor: "#A855F7",
          admin: "#EF4444",
        },
        // Brand convenience shades
        brand: {
          50: "#FFFDF0",
          100: "#FFF9D2",
          200: "#FDF0A5",
          300: "#FBE677",
          400: "#E5C34D",
          500: "#D4AF37",
          600: "#C5A028",
          700: "#A3821C",
          800: "#7F6413",
          900: "#101010",
        },
      },
      boxShadow: {
        gold: "0 4px 20px -2px rgba(212, 175, 55, 0.25)",
        goldLg: "0 10px 30px -4px rgba(212, 175, 55, 0.35)",
        surface: "0 4px 20px -2px rgba(0, 0, 0, 0.4)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
