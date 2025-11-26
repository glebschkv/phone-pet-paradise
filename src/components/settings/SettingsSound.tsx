import { AppSettings } from "@/hooks/useSettings";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Volume2, VolumeX, Music, Play, Leaf, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSoundProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const soundThemes = [
  { value: "default", label: "Classic", icon: Music, description: "Standard tones" },
  { value: "nature", label: "Nature", icon: Leaf, description: "Calming sounds" },
  { value: "minimal", label: "Minimal", icon: Sparkles, description: "Subtle alerts" },
];

export const SettingsSound = ({ settings, onUpdate }: SettingsSoundProps) => {
  const testSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = settings.soundVolume / 100;
    audio.play().catch(() => {
      console.log('Test sound played');
    });
  };

  return (
    <div className="space-y-3">
      {/* Sound Toggle */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              settings.soundEnabled ? "retro-level-badge" : "retro-stat-pill"
            )}>
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-sm font-bold">Sound Effects</Label>
              <p className="text-[10px] text-muted-foreground">Play audio notifications</p>
            </div>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => onUpdate({ soundEnabled: checked })}
          />
        </div>
      </div>

      {settings.soundEnabled && (
        <>
          {/* Volume Control */}
          <div className="retro-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-sm font-bold">Volume</Label>
                <p className="text-[10px] text-muted-foreground">Adjust sound level</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="retro-stat-pill px-3 py-1.5">
                  <span className="text-sm font-bold">{settings.soundVolume}%</span>
                </div>
                <button
                  onClick={testSound}
                  className="retro-stat-pill p-2 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[settings.soundVolume]}
              onValueChange={([value]) => onUpdate({ soundVolume: value })}
              className="w-full"
            />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Mute</span>
              <span>Max</span>
            </div>
          </div>

          {/* Sound Theme */}
          <div className="retro-card p-4">
            <Label className="text-sm font-bold mb-3 block">Sound Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {soundThemes.map((theme) => {
                const Icon = theme.icon;
                const isSelected = settings.soundTheme === theme.value;
                return (
                  <button
                    key={theme.value}
                    onClick={() => onUpdate({ soundTheme: theme.value as 'default' | 'nature' | 'minimal' })}
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
                      <div className="text-xs font-bold">{theme.label}</div>
                      <div className="text-[9px] text-muted-foreground">{theme.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!settings.soundEnabled && (
        <div className="retro-stat-pill p-4 text-center">
          <VolumeX className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Sound effects are disabled
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Enable sounds to customize volume and theme
          </p>
        </div>
      )}
    </div>
  );
};
