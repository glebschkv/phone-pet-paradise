import { useState } from "react";
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

  if (isLoading) {
    return (
      <div className="retro-shop-container h-full flex items-center justify-center">
        <div className="retro-card p-6 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-shop-container h-full flex flex-col">
      <div className="retro-corner retro-corner-tl" />
      <div className="retro-corner retro-corner-tr" />

      {/* Header */}
      <div className="retro-shop-header mx-3 mt-3">
        <div className="flex items-center gap-3 p-4">
          <div className="retro-shop-icon">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">Settings</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Customize Your Experience
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mx-3 mt-3">
        <div className="flex gap-2 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "retro-category-tab",
                  isActive && "retro-category-tab-active"
                )}
              >
                <div className="retro-category-icon">
                  <Icon className={cn(
                    "w-4 h-4",
                    isActive ? "opacity-100 drop-shadow-sm" : "opacity-40"
                  )} />
                </div>
                <span className="retro-category-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pt-3 pb-6">
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
