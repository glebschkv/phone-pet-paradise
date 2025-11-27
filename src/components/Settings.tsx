import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { SettingsAppearance } from "@/components/settings/SettingsAppearance";
import { SettingsTimer } from "@/components/settings/SettingsTimer";
import { SettingsSound } from "@/components/settings/SettingsSound";
import { SettingsGame } from "@/components/settings/SettingsGame";
import { SettingsData } from "@/components/settings/SettingsData";
import { SettingsAbout } from "@/components/settings/SettingsAbout";
import { Loader2, Palette, Clock, Volume2, Gamepad2, Database, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "appearance", label: "Theme", icon: Palette },
  { id: "timer", label: "Timer", icon: Clock },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "data", label: "Data", icon: Database },
  { id: "about", label: "About", icon: Heart },
];

export const Settings = () => {
  const { settings, isLoading, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
      }}>
        <div className="retro-card p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{
      background: 'linear-gradient(180deg, hsl(200 60% 85%) 0%, hsl(200 40% 92%) 50%, hsl(40 50% 93%) 100%)'
    }}>
      {/* Header */}
      <div className="retro-card mx-3 mt-3 overflow-hidden">
        {/* Title */}
        <div className="p-4 border-b border-border/30">
          <h1 className="text-xl font-bold">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Customize your experience</p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2.5 flex flex-col items-center gap-1 transition-all active:scale-95",
                  isActive
                    ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900"
                    : "text-muted-foreground hover:bg-muted/30"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-3">
        {activeTab === "appearance" && (
          <SettingsAppearance
            settings={settings}
            onUpdate={updateSettings}
          />
        )}

        {activeTab === "timer" && (
          <SettingsTimer
            settings={settings}
            onUpdate={updateSettings}
          />
        )}

        {activeTab === "sound" && (
          <SettingsSound
            settings={settings}
            onUpdate={updateSettings}
          />
        )}

        {activeTab === "game" && (
          <SettingsGame
            settings={settings}
            onUpdate={updateSettings}
          />
        )}

        {activeTab === "data" && (
          <SettingsData
            settings={settings}
            onUpdate={updateSettings}
            onReset={resetSettings}
            onExport={exportSettings}
            onImport={importSettings}
          />
        )}

        {activeTab === "about" && (
          <SettingsAbout />
        )}
      </div>
    </div>
  );
};
