import { AppSettings } from "@/hooks/useSettings";
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

export const SettingsAppearance = ({ settings, onUpdate }: SettingsAppearanceProps) => {
  return (
    <div className="space-y-4">
      {/* Theme Selection */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sun className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">COLOR SCHEME</span>
        </div>
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
                  isSelected
                    ? "bg-purple-500/20 border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                    : "bg-purple-900/30 border-2 border-purple-600/30"
                )}
              >
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center border border-green-300">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  isSelected ? "retro-level-badge" : "retro-stat-pill"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold text-white">{option.label}</div>
                  <div className="text-[11px] text-purple-300/70">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
