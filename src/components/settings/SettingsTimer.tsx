import { AppSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Clock, Bell } from "lucide-react";

interface SettingsTimerProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

export const SettingsTimer = ({ settings, onUpdate }: SettingsTimerProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timer Settings
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your focus sessions and breaks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Focus Sessions</CardTitle>
          <CardDescription>
            Set your default focus and break durations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="focus-time">
              Focus Time: {settings.defaultFocusTime} minutes
            </Label>
            <Slider
              id="focus-time"
              min={15}
              max={90}
              step={5}
              value={[settings.defaultFocusTime]}
              onValueChange={([value]) => onUpdate({ defaultFocusTime: value })}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="short-break">
              Short Break: {settings.shortBreakTime} minutes
            </Label>
            <Slider
              id="short-break"
              min={3}
              max={15}
              step={1}
              value={[settings.shortBreakTime]}
              onValueChange={([value]) => onUpdate({ shortBreakTime: value })}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="long-break">
              Long Break: {settings.longBreakTime} minutes
            </Label>
            <Slider
              id="long-break"
              min={10}
              max={30}
              step={5}
              value={[settings.longBreakTime]}
              onValueChange={([value]) => onUpdate({ longBreakTime: value })}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="long-break-interval">
              Long Break After: {settings.longBreakInterval} focus sessions
            </Label>
            <Slider
              id="long-break-interval"
              min={2}
              max={8}
              step={1}
              value={[settings.longBreakInterval]}
              onValueChange={([value]) => onUpdate({ longBreakInterval: value })}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Control when and how you get notified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your timer ends
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.enableNotifications}
              onCheckedChange={(checked) => onUpdate({ enableNotifications: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};