import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsAppearance } from "@/components/settings/SettingsAppearance";
import { SettingsTimer } from "@/components/settings/SettingsTimer";
import { SettingsSound } from "@/components/settings/SettingsSound";
import { SettingsGame } from "@/components/settings/SettingsGame";
import { SettingsData } from "@/components/settings/SettingsData";
import { SettingsAbout } from "@/components/settings/SettingsAbout";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const Settings = () => {
  const { settings, isLoading, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Customize your Phone Pet Paradise experience</p>
      </div>

      <Card className="p-1">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="appearance" className="text-xs">Theme</TabsTrigger>
            <TabsTrigger value="timer" className="text-xs">Timer</TabsTrigger>
            <TabsTrigger value="sound" className="text-xs">Sound</TabsTrigger>
            <TabsTrigger value="game" className="text-xs">Game</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
            <TabsTrigger value="about" className="text-xs">About</TabsTrigger>
          </TabsList>

          <div className="p-4">
            <TabsContent value="appearance" className="mt-0">
              <SettingsAppearance 
                settings={settings}
                onUpdate={updateSettings}
              />
            </TabsContent>

            <TabsContent value="timer" className="mt-0">
              <SettingsTimer 
                settings={settings}
                onUpdate={updateSettings}
              />
            </TabsContent>

            <TabsContent value="sound" className="mt-0">
              <SettingsSound 
                settings={settings}
                onUpdate={updateSettings}
              />
            </TabsContent>

            <TabsContent value="game" className="mt-0">
              <SettingsGame 
                settings={settings}
                onUpdate={updateSettings}
              />
            </TabsContent>

            <TabsContent value="data" className="mt-0">
              <SettingsData 
                settings={settings}
                onUpdate={updateSettings}
                onReset={resetSettings}
                onExport={exportSettings}
                onImport={importSettings}
              />
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <SettingsAbout />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
};