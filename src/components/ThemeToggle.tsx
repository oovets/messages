import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { resolved, setTheme } = useTheme();
  const superlightMode = useAppStore((s) => s.superlightMode);
  const isDark = resolved === "dark";
  const textMode = superlightMode && !compact;
  return (
    <Button
      variant="ghost"
      size={textMode ? "sm" : "icon"}
      className={cn("h-8 text-muted-foreground", textMode ? "w-auto px-2" : "w-8")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {textMode ? (
        isDark ? "Light" : "Dark"
      ) : (
        <>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </>
      )}
    </Button>
  );
}
