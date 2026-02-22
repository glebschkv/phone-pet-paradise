import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Gamepad2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsGameProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsGame = ({ settings, onUpdate }: SettingsGameProps) => {
  return (
    <div className="space-y-4">
      {/* Toggles - Combined */}
      <div className="retro-game-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gamepad2 className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold retro-pixel-text text-white">GAMEPLAY</span>
        </div>

        <div className="space-y-4">
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
                <Label className="text-xs font-bold text-white">Haptic Feedback</Label>
                <p className="text-[11px] text-purple-300/80">Vibration on interactions</p>
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
