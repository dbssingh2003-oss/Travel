import React from "react";
import { Moon, Sun } from "lucide-react";
import { useUIStore } from "../../store/uiStore";

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg border border-surface-border bg-surface-hover/50 hover:bg-surface-border text-muted-fg hover:text-text-main transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
