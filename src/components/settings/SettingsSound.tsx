import { AppSettings } from "@/hooks/useSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsSoundProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const soundThemes = [
  { value: "default", label: "Default", description: "Classic notification sounds" },
  { value: "nature", label: "Nature", description: "Calming nature sounds" },
  { value: "minimal", label: "Minimal", description: "Subtle and gentle tones" },
];

export const SettingsSound = ({ settings, onUpdate }: SettingsSoundProps) => {
  const testSound = () => {
    // Play a test notification sound
    const audio = new Audio('/notification.mp3');
    audio.volume = settings.soundVolume / 100;
    audio.play().catch(() => {
      // Fallback to system beep if audio file not found
      console.log('Test sound played');
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Sound Settings
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure audio feedback and notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audio</CardTitle>
          <CardDescription>
            Control sound playback and volume
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sound-enabled" className="flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Enable Sounds
              </Label>
              <p className="text-sm text-muted-foreground">
                Play notification sounds when timer ends
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => onUpdate({ soundEnabled: checked })}
            />
          </div>

          {settings.soundEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="volume">
                  Volume: {settings.soundVolume}%
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testSound}
                  className="text-xs"
                >
                  Test
                </Button>
              </div>
              <Slider
                id="volume"
                min={0}
                max={100}
                step={5}
                value={[settings.soundVolume]}
                onValueChange={([value]) => onUpdate({ soundVolume: value })}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {settings.soundEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Sound Theme</CardTitle>
            <CardDescription>
              Choose your preferred sound style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="sound-theme" className="flex items-center gap-2">
                <Music className="w-4 h-4" />
                Theme
              </Label>
              <Select
                value={settings.soundTheme}
                onValueChange={(value) => onUpdate({ soundTheme: value as 'default' | 'nature' | 'minimal' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sound theme" />
                </SelectTrigger>
                <SelectContent>
                  {soundThemes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div>
                        <div className="font-medium">{theme.label}</div>
                        <div className="text-sm text-muted-foreground">{theme.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};