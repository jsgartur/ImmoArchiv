import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";
export const THEME_KEY = "vermietify-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/** Liest/setzt das Theme, synchron mit dem <html>-Klassennamen und localStorage. */
export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_KEY) as Theme | null) ?? undefined;
    const current: Theme = stored ?? (document.documentElement.classList.contains("dark") ? "dark" : "light");
    setThemeState(current);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  };

  return [theme, setTheme];
}

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const [theme, setTheme] = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={`Zu ${next === "dark" ? "dunklem" : "hellem"} Modus wechseln`}
      title={`Zu ${next === "dark" ? "dunklem" : "hellem"} Modus wechseln`}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {showLabel && <span>{theme === "dark" ? "Heller Modus" : "Dunkler Modus"}</span>}
    </button>
  );
}
