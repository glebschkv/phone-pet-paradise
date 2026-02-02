import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BACKGROUND_THEMES } from "./constants";

interface BackgroundThemeSwitcherProps {
  currentTheme: string;
  currentLevel: number;
  onThemeChange: (themeId: string) => void;
}

export const BackgroundThemeSwitcher = ({
  currentTheme,
  currentLevel,
  onThemeChange
}: BackgroundThemeSwitcherProps) => {
  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center gap-2">
        {BACKGROUND_THEMES.map((theme) => {
          const Icon = theme.icon;
          const isSelected = currentTheme === theme.id;
          const isLocked = theme.unlockLevel > currentLevel;

          return (
            <button
              key={theme.id}
              onClick={() => !isLocked && onThemeChange(theme.id)}
              disabled={isLocked}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                isLocked
                  ? "opacity-40 cursor-not-allowed"
                  : "active:scale-95",
                isSelected && !isLocked
                  ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                  : !isLocked && "opacity-60 hover:opacity-100"
              )}
              style={{
                background: isLocked
                  ? 'hsl(var(--muted) / 0.5)'
                  : isSelected
                    ? 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)'
                    : 'hsl(var(--card) / 0.6)',
                border: '2px solid hsl(var(--border))',
                boxShadow: isSelected && !isLocked
                  ? '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                  : 'none'
              }}
              title={isLocked ? `Unlock at Lv.${theme.unlockLevel}` : theme.name}
            >
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Icon className={cn(
                  "w-4 h-4",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
