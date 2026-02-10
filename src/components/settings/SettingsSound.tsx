import { useState } from 'react';
import { AppSettings } from "@/hooks/useSettings";
import { soundLogger } from "@/lib/logger";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Volume2, VolumeX, Music, Play, Leaf, Sparkles, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { setClickSoundEnabled } from "@/hooks/useClickSound";

interface SettingsSoundProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
}

const soundThemes = [
  { value: "default", label: "Classic", icon: Music },
  { value: "nature", label: "Nature", icon: Leaf },
  { value: "minimal", label: "Minimal", icon: Sparkles },
];

export const SettingsSound = ({ settings, onUpdate }: SettingsSoundProps) => {
  const [clickSoundOn, setClickSoundOn] = useState(() => {
    try {
      return localStorage.getItem('petIsland_clickSoundEnabled') !== 'false';
    } catch { return true; }
  });

  const testSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = settings.soundVolume / 100;
    audio.play().catch(() => {
      soundLogger.debug('Test sound played');
    });
  };

  return (
    <div className="space-y-3">
      {/* Main Sound Card */}
      <div className="retro-card p-4">
        {/* Sound Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              settings.soundEnabled ? "retro-level-badge" : "retro-stat-pill"
            )}>
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-sm font-bold">Sound Effects</Label>
              <p className="text-[10px] text-muted-foreground">Audio notifications</p>
            </div>
          </div>
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => onUpdate({ soundEnabled: checked })}
          />
        </div>

        {settings.soundEnabled && (
          <>
            <div className="border-t border-border/30 my-4" />

            {/* Volume Control */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold">Volume</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{settings.soundVolume}%</span>
                  <button
                    onClick={testSound}
                    className="retro-stat-pill p-1.5 rounded-md active:scale-95 transition-all"
                  >
                    <Play className="w-3 h-3" />
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
            </div>

            {/* Sound Theme */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Sound Theme</Label>
              <div className="flex gap-2">
                {soundThemes.map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = settings.soundTheme === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => onUpdate({ soundTheme: theme.value as 'default' | 'nature' | 'minimal' })}
                      className={cn(
                        "flex-1 p-2.5 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95",
                        isSelected && "ring-2 ring-primary"
                      )}
                      style={{
                        background: isSelected
                          ? 'linear-gradient(180deg, hsl(45 80% 90%) 0%, hsl(var(--card)) 100%)'
                          : 'hsl(var(--card))',
                        border: '2px solid hsl(var(--border))',
                        boxShadow: isSelected
                          ? '0 2px 0 hsl(var(--border) / 0.6)'
                          : '0 1px 0 hsl(var(--border) / 0.4)'
                      }}
                    >
                      <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[10px] font-bold">{theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Button Click Sounds */}
      <div className="retro-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center",
              clickSoundOn ? "retro-level-badge" : "retro-stat-pill"
            )}>
              <MousePointerClick className={cn("w-4 h-4", !clickSoundOn && "text-muted-foreground")} />
            </div>
            <div>
              <Label className="text-sm font-bold">Button Sounds</Label>
              <p className="text-[11px] text-muted-foreground">Subtle tap feedback</p>
            </div>
          </div>
          <Switch
            checked={clickSoundOn}
            onCheckedChange={(checked) => {
              setClickSoundOn(checked);
              setClickSoundEnabled(checked);
            }}
          />
        </div>
      </div>

    </div>
  );
};
