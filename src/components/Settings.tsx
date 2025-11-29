import { useState, useRef, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { SettingsAppearance } from "@/components/settings/SettingsAppearance";
import { SettingsTimer } from "@/components/settings/SettingsTimer";
import { SettingsSound } from "@/components/settings/SettingsSound";
import { SettingsGame } from "@/components/settings/SettingsGame";
import { SettingsData } from "@/components/settings/SettingsData";
import { SettingsAbout } from "@/components/settings/SettingsAbout";
import { SettingsAccount } from "@/components/settings/SettingsAccount";
import { SettingsProfile } from "@/components/settings/SettingsProfile";
import { SettingsAnalytics } from "@/components/settings/SettingsAnalytics";
import { Loader2, Palette, Clock, Volume2, Gamepad2, Database, Heart, Settings as SettingsIcon, UserCircle, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", icon: UserCircle },
  { id: "appearance", label: "Theme", icon: Palette },
  { id: "timer", label: "Timer", icon: Clock },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "sound", label: "Sound", icon: Volume2 },
  { id: "game", label: "Game", icon: Gamepad2 },
  { id: "data", label: "Data", icon: Database },
  { id: "about", label: "About", icon: Heart },
];

export const Settings = () => {
  const { settings, isLoading, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("account");
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const tab = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      const scrollLeft = tab.offsetLeft - (containerRect.width / 2) + (tabRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeTab]);

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
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 retro-level-badge rounded-xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-xs text-muted-foreground">Customize your experience</p>
          </div>
        </div>
      </div>

      {/* Scrollable Tab Navigation */}
      <div className="px-3 pb-3">
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-1 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all active:scale-95 flex-shrink-0",
                  isActive
                    ? "bg-gradient-to-b from-amber-300 to-amber-400 text-amber-900 shadow-md"
                    : "retro-card text-muted-foreground"
                )}
                style={isActive ? {
                  boxShadow: '0 3px 0 hsl(35 80% 35%), inset 0 1px 0 hsl(45 100% 70% / 0.3)'
                } : {}}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-3">
        {activeTab === "account" && (
          <div className="space-y-3">
            <SettingsProfile />
            <SettingsAccount />
          </div>
        )}

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

        {activeTab === "analytics" && (
          <SettingsAnalytics />
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
