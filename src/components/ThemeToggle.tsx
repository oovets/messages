import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact: _compact = false }: ThemeToggleProps) {
  const { resolved, setTheme } = useTheme();
  const isDark = resolved === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
