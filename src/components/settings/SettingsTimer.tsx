import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsTimerProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsTimer = ({ settings, onUpdate }: SettingsTimerProps) => {
  return (
    <div className="space-y-3">
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
              <p className="text-[11px] text-muted-foreground">Alert when timer ends</p>
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
