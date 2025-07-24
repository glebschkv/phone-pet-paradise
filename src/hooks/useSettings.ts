import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface AppSettings {
  // Appearance
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  
  // Timer
  defaultFocusTime: number; // in minutes
  shortBreakTime: number;
  longBreakTime: number;
  longBreakInterval: number; // after how many focus sessions
  enableNotifications: boolean;
  
  // Sound
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  soundTheme: 'default' | 'nature' | 'minimal';
  
  // Game
  animationSpeed: 'slow' | 'normal' | 'fast';
  showTutorialHints: boolean;
  autoSaveProgress: boolean;
  
  // Privacy
  dataCollection: boolean;
  crashReporting: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  primaryColor: 'default',
  defaultFocusTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  enableNotifications: true,
  soundEnabled: true,
  soundVolume: 70,
  soundTheme: 'default',
  animationSpeed: 'normal',
  showTutorialHints: true,
  autoSaveProgress: true,
  dataCollection: true,
  crashReporting: true,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Settings Error",
        description: "Failed to load saved settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('app-settings', JSON.stringify(updatedSettings));
      
      // Apply theme changes immediately
      if (newSettings.theme) {
        applyTheme(newSettings.theme);
      }
      
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Save Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('app-settings');
    applyTheme(defaultSettings.theme);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults.",
    });
  };

  // Export settings
  const exportSettings = () => {
    try {
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'phone-pet-paradise-settings.json';
      link.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings Exported",
        description: "Settings file has been downloaded.",
      });
    } catch (error) {
      console.error('Failed to export settings:', error);
      toast({
        title: "Export Error",
        description: "Failed to export settings.",
        variant: "destructive",
      });
    }
  };

  // Import settings
  const importSettings = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const imported = JSON.parse(content);
          
          // Validate imported settings
          const validatedSettings = { ...defaultSettings, ...imported };
          updateSettings(validatedSettings);
          
          toast({
            title: "Settings Imported",
            description: "Settings have been successfully imported.",
          });
          resolve();
        } catch (error) {
          console.error('Failed to import settings:', error);
          toast({
            title: "Import Error",
            description: "Invalid settings file format.",
            variant: "destructive",
          });
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    applyTheme,
  };
};