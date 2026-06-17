import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 bg-secondary/60 rounded-full p-1 ${className}`}>
      <button
        type="button"
        onClick={() => theme !== "light" && toggleTheme()}
        aria-label="Tema claro"
        title="Tema claro"
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => theme !== "dark" && toggleTheme()}
        aria-label="Tema escuro"
        title="Tema escuro"
        className={`flex items-center justify-center w-7 h-7 rounded-full transition-all ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
