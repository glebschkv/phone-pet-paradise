import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Clock, Coffee, Zap, Bell, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTimerProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsTimer = ({ settings, onUpdate }: SettingsTimerProps) => {
  return (
    <div className="space-y-3">
      {/* Focus & Break Times - Combined Card */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-4 h-4 text-primary" />
          <Label className="text-sm font-bold">Session Durations</Label>
        </div>

        <div className="space-y-5">
          {/* Focus Time */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-level-badge rounded-md flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold">Focus</span>
              </div>
              <span className="text-sm font-bold text-primary">{settings.defaultFocusTime}m</span>
            </div>
            <Slider
              min={15}
              max={90}
              step={5}
              value={[settings.defaultFocusTime]}
              onValueChange={([value]) => onUpdate({ defaultFocusTime: value })}
              className="w-full"
            />
          </div>

          {/* Short Break */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-stat-pill rounded-md flex items-center justify-center">
                  <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold">Short Break</span>
              </div>
              <span className="text-sm font-bold">{settings.shortBreakTime}m</span>
            </div>
            <Slider
              min={3}
              max={15}
              step={1}
              value={[settings.shortBreakTime]}
              onValueChange={([value]) => onUpdate({ shortBreakTime: value })}
              className="w-full"
            />
          </div>

          {/* Long Break */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 retro-stat-pill rounded-md flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-xs font-semibold">Long Break</span>
              </div>
              <span className="text-sm font-bold">{settings.longBreakTime}m</span>
            </div>
            <Slider
              min={10}
              max={30}
              step={5}
              value={[settings.longBreakTime]}
              onValueChange={([value]) => onUpdate({ longBreakTime: value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              settings.enableNotifications ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <Label className="text-sm font-bold">Notifications</Label>
              <p className="text-[10px] text-muted-foreground">Alert when timer ends</p>
            </div>
          </div>
          <Switch
            checked={settings.enableNotifications}
            onCheckedChange={(checked) => onUpdate({ enableNotifications: checked })}
          />
        </div>
      </div>
    </div>
  );
};
