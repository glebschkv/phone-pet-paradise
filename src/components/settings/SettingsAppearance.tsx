import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsAppearanceProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const themeOptions = [
  { value: "light", label: "Light", icon: Sun, description: "Always light" },
  { value: "dark", label: "Dark", icon: Moon, description: "Always dark" },
  { value: "system", label: "Auto", icon: Monitor, description: "Follow system" },
];

const colorOptions = [
  { value: "default", label: "Ocean", color: "bg-blue-500" },
  { value: "emerald", label: "Emerald", color: "bg-emerald-500" },
  { value: "purple", label: "Purple", color: "bg-purple-500" },
  { value: "rose", label: "Rose", color: "bg-rose-500" },
  { value: "orange", label: "Orange", color: "bg-orange-500" },
];

export const SettingsAppearance = ({ settings, onUpdate }: SettingsAppearanceProps) => {
  return (
    <div className="space-y-3">
      {/* Theme Selection */}
      <div className="retro-card p-4">
        <Label className="text-sm font-bold mb-3 block">Color Scheme</Label>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onUpdate({ theme: option.value as 'light' | 'dark' | 'system' })}
                className={cn(
                  "relative p-3 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95",
                  isSelected && "ring-2 ring-primary"
                )}
                style={{
                  background: isSelected
                    ? 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
                    : 'hsl(var(--card))',
                  border: '2px solid hsl(var(--border))',
                  boxShadow: isSelected
                    ? '0 3px 0 hsl(var(--border) / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : '0 2px 0 hsl(var(--border) / 0.4)'
                }}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "retro-level-badge" : "retro-stat-pill"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold">{option.label}</div>
                  <div className="text-[10px] text-muted-foreground">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="retro-card p-4">
        <Label className="text-sm font-bold mb-3 block">Accent Color</Label>
        <div className="flex gap-2 justify-between">
          {colorOptions.map((color) => {
            const isSelected = settings.primaryColor === color.value;
            return (
              <button
                key={color.value}
                onClick={() => onUpdate({ primaryColor: color.value })}
                className={cn(
                  "flex-1 p-2.5 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95",
                  isSelected && "ring-2 ring-primary"
                )}
                style={{
                  background: isSelected
                    ? 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
                    : 'hsl(var(--card))',
                  border: '2px solid hsl(var(--border))',
                  boxShadow: isSelected
                    ? '0 3px 0 hsl(var(--border) / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.2)'
                    : '0 2px 0 hsl(var(--border) / 0.4)'
                }}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 border-white/50 shadow-sm",
                  color.color,
                  isSelected && "ring-2 ring-offset-2 ring-primary"
                )} />
                <span className="text-[10px] font-semibold">{color.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview hint */}
      <div className="retro-stat-pill p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Changes are applied instantly
        </p>
      </div>
    </div>
  );
};
