import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BACKGROUND_THEMES } from "./constants";

interface BackgroundThemeSwitcherProps {
  currentTheme: string;
  isPremium: boolean;
  onThemeChange: (themeId: string) => void;
  onLockedClick: () => void;
}

export const BackgroundThemeSwitcher = ({
  currentTheme,
  isPremium,
  onThemeChange,
  onLockedClick,
}: BackgroundThemeSwitcherProps) => {
  return (
    <div className="w-full max-w-sm">
      <div className="flex justify-center gap-2">
        {BACKGROUND_THEMES.map((theme) => {
          const Icon = theme.icon;
          const isSelected = currentTheme === theme.id;
          const isLocked = theme.requiresPremium && !isPremium;

          return (
            <button
              key={theme.id}
              onClick={() => isLocked ? onLockedClick() : onThemeChange(theme.id)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all relative",
                isLocked
                  ? "cursor-pointer active:scale-95"
                  : "active:scale-95",
                isSelected && !isLocked
                  ? "ring-2 ring-white ring-offset-2 ring-offset-transparent"
                  : !isLocked && "opacity-60 hover:opacity-100"
              )}
              style={isLocked ? {
                background: 'linear-gradient(180deg, hsl(40 50% 18%) 0%, hsl(35 45% 12%) 100%)',
                border: '2px solid hsl(40 70% 45%)',
                boxShadow: '0 0 8px hsl(40 80% 50% / 0.3), inset 0 1px 0 hsl(40 60% 55% / 0.3)',
              } : {
                background: isSelected
                  ? 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.9) 100%)'
                  : 'hsl(var(--card) / 0.6)',
                border: '2px solid hsl(var(--border))',
                boxShadow: isSelected
                  ? '0 2px 0 hsl(var(--border) / 0.5), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                  : 'none'
              }}
              title={isLocked ? 'Premium' : theme.name}
            >
              {isLocked ? (
                <Crown className="w-4 h-4" style={{ color: 'hsl(40 80% 60%)' }} />
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
