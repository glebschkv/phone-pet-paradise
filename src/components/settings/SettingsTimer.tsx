import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Clock, Coffee, Zap, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTimerProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsTimer = ({ settings, onUpdate }: SettingsTimerProps) => {
  return (
    <div className="space-y-3">
      {/* Focus Time */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-level-badge rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-bold">Focus Duration</Label>
            <p className="text-[10px] text-muted-foreground">How long each focus session lasts</p>
          </div>
          <div className="retro-stat-pill px-3 py-1.5">
            <span className="text-sm font-bold">{settings.defaultFocusTime}m</span>
          </div>
        </div>
        <Slider
          min={15}
          max={90}
          step={5}
          value={[settings.defaultFocusTime]}
          onValueChange={([value]) => onUpdate({ defaultFocusTime: value })}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>15 min</span>
          <span>90 min</span>
        </div>
      </div>

      {/* Break Times */}
      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-stat-pill rounded-lg flex items-center justify-center">
            <Coffee className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-bold">Short Break</Label>
            <p className="text-[10px] text-muted-foreground">Quick rest between sessions</p>
          </div>
          <div className="retro-stat-pill px-3 py-1.5">
            <span className="text-sm font-bold">{settings.shortBreakTime}m</span>
          </div>
        </div>
        <Slider
          min={3}
          max={15}
          step={1}
          value={[settings.shortBreakTime]}
          onValueChange={([value]) => onUpdate({ shortBreakTime: value })}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>3 min</span>
          <span>15 min</span>
        </div>
      </div>

      <div className="retro-card p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 retro-stat-pill rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-bold">Long Break</Label>
            <p className="text-[10px] text-muted-foreground">Extended rest period</p>
          </div>
          <div className="retro-stat-pill px-3 py-1.5">
            <span className="text-sm font-bold">{settings.longBreakTime}m</span>
          </div>
        </div>
        <Slider
          min={10}
          max={30}
          step={5}
          value={[settings.longBreakTime]}
          onValueChange={([value]) => onUpdate({ longBreakTime: value })}
          className="w-full"
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>10 min</span>
          <span>30 min</span>
        </div>
      </div>

      {/* Long Break Interval */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Label className="text-sm font-bold">Long Break After</Label>
            <p className="text-[10px] text-muted-foreground">Sessions before long break</p>
          </div>
          <div className="retro-level-badge px-3 py-1.5">
            <span className="text-sm font-bold">{settings.longBreakInterval} sessions</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => onUpdate({ longBreakInterval: num })}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-bold transition-all active:scale-95",
                settings.longBreakInterval === num
                  ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 border-2 border-amber-500"
                  : "retro-stat-pill"
              )}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.enableNotifications ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <Bell className="w-5 h-5" />
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
