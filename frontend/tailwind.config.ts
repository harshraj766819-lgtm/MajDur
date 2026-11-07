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
        // MajDur Premium Dark Palette
        majdur: {
          bg: "#101010",
          card: "#181818",
          cardHover: "#222222",
          border: "#2a2a2a",
          gold: "#D4AF37",
          goldHover: "#C5A028",
          goldLight: "#F3E5AB",
          textPrimary: "#FFFFFF",
          textSecondary: "#A1A1AA",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
        },
        // Brand aliases
        brand: {
          50: "#fff9eb",
          100: "#feedc7",
          200: "#fdd98a",
          300: "#fbc14d",
          400: "#faa31e",
          500: "#D4AF37", // Primary gold
          600: "#C5A028",
          700: "#aa4708",
          800: "#88370e",
          900: "#101010",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
