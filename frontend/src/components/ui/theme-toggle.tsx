"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-majdur-border bg-majdur-card text-majdur-textSecondary hover:text-majdur-textPrimary hover:border-majdur-gold/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-majdur-gold ${className || ""}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-[#D4AF37]" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700" />
      )}
    </button>
  );
}

