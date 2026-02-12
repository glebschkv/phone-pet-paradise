import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap, HelpCircle, Save, Turtle, Rabbit, Gauge, Gamepad2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsGameProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const animationSpeedOptions = [
  { value: "slow", label: "Slow", icon: Turtle },
  { value: "normal", label: "Normal", icon: Gauge },
  { value: "fast", label: "Fast", icon: Rabbit },
];

export const SettingsGame = ({ settings, onUpdate }: SettingsGameProps) => {
  return (
    <div className="space-y-3">
      {/* Animation Speed */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Animation Speed</Label>
        </div>
        <div className="flex gap-2">
          {animationSpeedOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.animationSpeed === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onUpdate({ animationSpeed: option.value as 'slow' | 'normal' | 'fast' })}
                className={cn(
                  "flex-1 p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all active:scale-95",
                  isSelected && "ring-2 ring-primary"
                )}
                style={{
                  background: isSelected
                    ? 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
                    : 'hsl(var(--card))',
                  border: '2px solid hsl(var(--border))',
                  boxShadow: isSelected
                    ? '0 3px 0 hsl(var(--border) / 0.6)'
                    : '0 2px 0 hsl(var(--border) / 0.4)'
                }}
              >
                <Icon className={cn("w-5 h-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-bold">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toggles - Combined */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Gameplay Options</Label>
        </div>

        <div className="space-y-4">
          {/* Tutorial Hints */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                settings.showTutorialHints ? "retro-level-badge" : "retro-stat-pill"
              )}>
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-xs font-bold">Tutorial Hints</Label>
                <p className="text-[11px] text-muted-foreground">Tips for new features and controls</p>
              </div>
            </div>
            <Switch
              checked={settings.showTutorialHints}
              onCheckedChange={(checked) => onUpdate({ showTutorialHints: checked })}
            />
          </div>

          <div className="border-t border-border/30" />

          {/* Auto-Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                settings.autoSaveProgress ? "retro-level-badge" : "retro-stat-pill"
              )}>
                <Save className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-xs font-bold">Auto-Save</Label>
                <p className="text-[11px] text-muted-foreground">Save progress automatically</p>
              </div>
            </div>
            <Switch
              checked={settings.autoSaveProgress}
              onCheckedChange={(checked) => onUpdate({ autoSaveProgress: checked })}
            />
          </div>

          <div className="border-t border-border/30" />

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                settings.hapticFeedback ? "retro-level-badge" : "retro-stat-pill"
              )}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-xs font-bold">Haptic Feedback</Label>
                <p className="text-[11px] text-muted-foreground">Vibration on interactions</p>
              </div>
            </div>
            <Switch
              checked={settings.hapticFeedback}
              onCheckedChange={(checked) => onUpdate({ hapticFeedback: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
