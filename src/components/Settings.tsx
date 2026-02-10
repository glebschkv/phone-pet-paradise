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
import { SettingsFocusMode } from "@/components/settings/SettingsFocusMode";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Clock, Database, Heart, Settings as SettingsIcon, UserCircle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "account", label: "Account", icon: UserCircle },
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "timer", label: "Timer & Focus", icon: Clock },
  { id: "data", label: "Data & Privacy", icon: Database },
  { id: "about", label: "About", icon: Heart },
];

export const Settings = () => {
  const { settings, isLoading, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("account");
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

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
      <div className="h-full flex items-center justify-center">
        <div className="retro-card p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="retro-card p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, hsl(260 55% 58%) 0%, hsl(260 50% 45%) 100%)',
              border: '2px solid hsl(260 45% 38%)',
              boxShadow: '0 2px 0 hsl(260 45% 30%), inset 0 1px 0 hsl(260 60% 75% / 0.4)',
            }}
          >
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight">Settings</h1>
            <p className="text-[11px] text-muted-foreground">Customize your experience</p>
          </div>
        </div>
      </div>

      {/* Scrollable Tab Navigation */}
      <div className="px-3 pb-2">
        <div
          ref={tabsRef}
          className="flex gap-1.5 overflow-x-auto py-1 -mx-1 px-1"
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
                  "flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all active:scale-95 flex-shrink-0",
                  isActive
                    ? "font-bold"
                    : "font-semibold text-muted-foreground"
                )}
                style={isActive ? {
                  background: 'linear-gradient(180deg, hsl(45 90% 65%) 0%, hsl(35 85% 52%) 100%)',
                  border: '2px solid hsl(30 80% 45%)',
                  color: 'hsl(30 60% 15%)',
                  boxShadow: '0 2px 0 hsl(30 80% 38%), inset 0 1px 0 hsl(50 100% 85% / 0.5)',
                } : {
                  background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.8) 100%)',
                  border: '2px solid hsl(var(--border) / 0.6)',
                  boxShadow: '0 1px 0 hsl(var(--border) / 0.3)',
                }}
              >
                <Icon className={cn("w-3.5 h-3.5", isActive ? "opacity-100" : "opacity-50")} />
                <span className="text-xs">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pt-1 pb-6">
          {activeTab === "account" && (
            <div className="space-y-3">
              <SettingsProfile />
              <SettingsAccount />
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-3">
              <SettingsAppearance
                settings={settings}
                onUpdate={updateSettings}
              />
              <SettingsSound
                settings={settings}
                onUpdate={updateSettings}
              />
              <SettingsGame
                settings={settings}
                onUpdate={updateSettings}
              />
            </div>
          )}

          {activeTab === "timer" && (
            <div className="space-y-3">
              <SettingsTimer
                settings={settings}
                onUpdate={updateSettings}
              />
              <SettingsFocusMode />
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-3">
              <SettingsAnalytics />
              <SettingsData
                settings={settings}
                onUpdate={updateSettings}
                onReset={resetSettings}
                onExport={exportSettings}
                onImport={importSettings}
              />
            </div>
          )}

          {activeTab === "about" && (
            <SettingsAbout />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
