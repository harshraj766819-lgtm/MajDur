import type { Config } from "tailwindcss";

const config: Config = {
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
        brand: {
          50: "#fff8eb",
          100: "#feedc7",
          200: "#fdd98a",
          300: "#fbc14d",
          400: "#faa31e",
          500: "#f0850c",
          600: "#d46506",
          700: "#aa4708",
          800: "#88370e",
          900: "#702e0f",
        },
      },
    },
  },
  plugins: [],
};
export default config;
