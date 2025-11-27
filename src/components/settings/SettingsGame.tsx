import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Zap, HelpCircle, Save, Turtle, Rabbit, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsGameProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const animationSpeedOptions = [
  { value: "slow", label: "Slow", icon: Turtle, description: "Relaxed pace" },
  { value: "normal", label: "Normal", icon: Gauge, description: "Balanced" },
  { value: "fast", label: "Fast", icon: Rabbit, description: "Quick actions" },
];

export const SettingsGame = ({ settings, onUpdate }: SettingsGameProps) => {
  return (
    <div className="space-y-3">
      {/* Animation Speed */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-level-badge rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <Label className="text-sm font-bold">Animation Speed</Label>
            <p className="text-[10px] text-muted-foreground">Control visual effects speed</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {animationSpeedOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = settings.animationSpeed === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onUpdate({ animationSpeed: option.value as 'slow' | 'normal' | 'fast' })}
                className={cn(
                  "p-3 rounded-lg flex flex-col items-center gap-2 transition-all active:scale-95",
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
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  isSelected ? "retro-level-badge" : "retro-stat-pill"
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold">{option.label}</div>
                  <div className="text-[9px] text-muted-foreground">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tutorial Hints */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.showTutorialHints ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-bold">Tutorial Hints</Label>
              <p className="text-[10px] text-muted-foreground">Show helpful tips & guidance</p>
            </div>
          </div>
          <Switch
            checked={settings.showTutorialHints}
            onCheckedChange={(checked) => onUpdate({ showTutorialHints: checked })}
          />
        </div>
      </div>

      {/* Auto-Save */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.autoSaveProgress ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <Save className="w-5 h-5" />
            </div>
            <div>
              <Label className="text-sm font-bold">Auto-Save</Label>
              <p className="text-[10px] text-muted-foreground">Automatically save progress</p>
            </div>
          </div>
          <Switch
            checked={settings.autoSaveProgress}
            onCheckedChange={(checked) => onUpdate({ autoSaveProgress: checked })}
          />
        </div>
      </div>

      {/* Info hint */}
      <div className="retro-stat-pill p-3 text-center">
        <p className="text-xs text-muted-foreground">
          Game settings affect gameplay experience
        </p>
      </div>
    </div>
  );
};
