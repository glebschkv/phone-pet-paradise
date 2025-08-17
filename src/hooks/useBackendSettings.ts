import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoSaveEnabled: boolean;
  timerSound: 'bell' | 'chime' | 'nature' | 'off';
  backgroundMusic: 'ambient' | 'nature' | 'off';
  animationSpeed: 'slow' | 'normal' | 'fast';
  displayName: string;
  language: 'en' | 'es' | 'fr' | 'de';
}

const defaultSettings: UserSettings = {
  theme: 'system',
  soundEnabled: true,
  notificationsEnabled: true,
  autoSaveEnabled: true,
  timerSound: 'bell',
  backgroundMusic: 'ambient',
  animationSpeed: 'normal',
  displayName: '',
  language: 'en'
};

export const useBackendSettings = () => {
  const { user, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from backend or localStorage fallback
  const loadSettings = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from localStorage for unauthenticated users
      const saved = localStorage.getItem('pet_paradise_settings');
      if (saved) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch (error) {
          console.error('Failed to load local settings:', error);
        }
      }
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Merge with localStorage settings for now
      // TODO: Create a settings table for more comprehensive settings storage
      const localSettings = localStorage.getItem('pet_paradise_settings');
      const parsedLocal = localSettings ? JSON.parse(localSettings) : {};

      setSettings({
        ...defaultSettings,
        ...parsedLocal,
        displayName: profile?.display_name || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('pet_paradise_settings');
      if (saved) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch (error) {
          console.error('Failed to load local settings:', error);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Save settings to backend and localStorage
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);

    // Always save to localStorage for immediate access
    localStorage.setItem('pet_paradise_settings', JSON.stringify(updatedSettings));

    // If authenticated and display name changed, update profile
    if (isAuthenticated && user && newSettings.displayName !== undefined) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: newSettings.displayName })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }

    // Apply theme immediately
    if (newSettings.theme) {
      applyTheme(newSettings.theme);
    }
  }, [settings, isAuthenticated, user]);

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, []);

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    localStorage.setItem('pet_paradise_settings', JSON.stringify(defaultSettings));
    
    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: '' })
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error resetting profile:', error);
      }
    }
    
    applyTheme(defaultSettings.theme);
  }, [isAuthenticated, user, applyTheme]);

  // Export settings to file
  const exportSettings = useCallback(async () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pet-paradise-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }, [settings]);

  // Import settings from file
  const importSettings = useCallback(async (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          
          // Validate and merge with defaults
          const validatedSettings = { ...defaultSettings, ...importedSettings };
          
          await updateSettings(validatedSettings);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [updateSettings]);

  // Load settings on mount and auth change
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply theme on settings change
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme, applyTheme]);

  return {
    settings,
    isLoading,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    loadSettings
  };
};