import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full border-border/70 bg-background/80 backdrop-blur-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">
        {isDark
          ? t({ en: "Switch to light mode", sv: "Växla till ljust läge" })
          : t({ en: "Switch to dark mode", sv: "Växla till mörkt läge" })}
      </span>
    </Button>
  );
}
