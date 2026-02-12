import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsAppearanceProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
] as const;

export const SettingsAppearance = ({ settings, onUpdate }: SettingsAppearanceProps) => {
  return (
    <div className="space-y-3">
      <div className="retro-card p-4">
        <Label className="text-sm font-bold mb-3 block">Appearance</Label>
        <div className="flex rounded-lg border-2 border-border overflow-hidden">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onUpdate({ theme: option.value as 'light' | 'dark' | 'system' })}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold transition-all active:scale-[0.97]",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
