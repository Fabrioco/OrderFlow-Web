"use client";

import { useTheme } from "@/contexts/ThemeProvider";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className={`
        relative w-14 h-7 rounded-full border transition-all duration-300 flex items-center px-1
        ${
          isDark
            ? "bg-accent/20 border-accent/40"
            : "bg-surface-alt border-border"
        }
      `}
    >
      {/* Track icons */}
      <SunIcon
        size={13}
        weight="bold"
        className={`absolute left-1.5 transition-opacity duration-200 text-amber-400 ${
          isDark ? "opacity-30" : "opacity-100"
        }`}
      />
      <MoonIcon
        size={13}
        weight="bold"
        className={`absolute right-1.5 transition-opacity duration-200 text-accent ${
          isDark ? "opacity-100" : "opacity-30"
        }`}
      />

      {/* Thumb */}
      <div
        className={`
          w-5 h-5 rounded-full shadow-sm transition-all duration-300 flex items-center justify-center
          ${
            isDark
              ? "translate-x-7 bg-accent"
              : "translate-x-0 bg-white border border-border"
          }
        `}
      />
    </button>
  );
}
