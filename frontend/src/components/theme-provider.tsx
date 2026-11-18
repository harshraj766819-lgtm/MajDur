"use client";

import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("majdur_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(saved);
    } else {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("majdur_theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Prevent flash before hydration
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
}

