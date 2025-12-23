import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface BackupData {
  version: string;
  timestamp: number;
  appState: any;
  xpSystem: any;
  streakSystem: any;
  settings: any;
  onboarding: any;
}

interface BackupMetadata {
  id: string;
  name: string;
  timestamp: number;
  size: number;
  version: string;
}

export const useDataBackup = () => {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const { toast } = useToast();

  // Get all app data for backup
  const collectAppData = useCallback((): BackupData => {
    const data: BackupData = {
      version: '1.0.0',
      timestamp: Date.now(),
      appState: {},
      xpSystem: {},
      streakSystem: {},
      settings: {},
      onboarding: {},
    };

    try {
      // Collect all localStorage data
      const keys = [
        'app-state-data',
        'xp-system-state', 
        'streak-system-data',
        'app-settings',
        'onboarding-completed',
        'performance-settings'
      ];

      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            const parsed = JSON.parse(value);
            switch (key) {
              case 'app-state-data':
                data.appState = parsed;
                break;
              case 'xp-system-state':
                data.xpSystem = parsed;
                break;
              case 'streak-system-data':
                data.streakSystem = parsed;
                break;
              case 'app-settings':
                data.settings = parsed;
                break;
              case 'onboarding-completed':
                data.onboarding = { completed: parsed };
                break;
            }
          } catch (error) {
            console.warn(`Failed to parse ${key}:`, error);
          }
        }
      });

      return data;
    } catch (error) {
      console.error('Failed to collect app data:', error);
      throw error;
    }
  }, []);

  // Create backup file
  const createBackup = useCallback(async (customName?: string) => {
    setIsCreatingBackup(true);
    
    try {
      const data = collectAppData();
      const filename = customName || `pet-paradise-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      URL.revokeObjectURL(url);
      
      // Save backup metadata
      const metadata: BackupMetadata = {
        id: `backup-${Date.now()}`,
        name: filename,
        timestamp: data.timestamp,
        size: blob.size,
        version: data.version,
      };
      
      const existingBackups = getLocalBackups();
      existingBackups.push(metadata);
      localStorage.setItem('backup-metadata', JSON.stringify(existingBackups));
      
      toast({
        title: "Backup Created",
        description: `Backup saved as ${filename}`,
      });
      
      return metadata;
    } catch (error) {
      console.error('Backup creation failed:', error);
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreatingBackup(false);
    }
  }, [collectAppData, toast]);

  // SECURITY: Validate backup data structure thoroughly
  const validateBackupData = (data: unknown): data is BackupData => {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const backup = data as Record<string, unknown>;

    // Required fields
    if (typeof backup.version !== 'string' || !backup.version) {
      return false;
    }
    if (typeof backup.timestamp !== 'number' || backup.timestamp <= 0) {
      return false;
    }

    // Validate timestamp is not in the future (prevent tampering)
    if (backup.timestamp > Date.now() + 60000) { // Allow 1 minute tolerance
      return false;
    }

    // Optional fields must be objects if present
    const optionalFields = ['appState', 'xpSystem', 'streakSystem', 'settings', 'onboarding'];
    for (const field of optionalFields) {
      if (backup[field] !== undefined && (typeof backup[field] !== 'object' || backup[field] === null)) {
        return false;
      }
    }

    return true;
  };

  // Restore from backup file
  const restoreBackup = useCallback(async (file: File) => {
    setIsRestoringBackup(true);

    try {
      // SECURITY: Validate file size (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Backup file is too large (max 10MB)');
      }

      // SECURITY: Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Invalid file type. Please select a JSON backup file');
      }

      const text = await file.text();

      // SECURITY: Parse JSON safely
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON format in backup file');
      }

      // SECURITY: Validate backup structure thoroughly
      if (!validateBackupData(parsedData)) {
        throw new Error('Invalid backup file structure');
      }

      const data = parsedData;
      
      // Confirm restore with user
      const confirmed = window.confirm(
        `This will restore your data from ${new Date(data.timestamp).toLocaleDateString()}. ` +
        'Your current progress will be overwritten. Continue?'
      );
      
      if (!confirmed) {
        setIsRestoringBackup(false);
        return;
      }
      
      // Create current state backup before restoring
      await createBackup('auto-backup-before-restore');
      
      // Restore data
      Object.entries({
        'app-state-data': data.appState,
        'xp-system-state': data.xpSystem,
        'streak-system-data': data.streakSystem,
        'app-settings': data.settings,
        'onboarding-completed': data.onboarding?.completed,
      }).forEach(([key, value]) => {
        if (value && Object.keys(value).length > 0) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      
      toast({
        title: "Backup Restored",
        description: "Your data has been restored. Please refresh the page.",
      });
      
      // Refresh page to apply changes
      setTimeout(() => window.location.reload(), 2000);
      
    } catch (error) {
      console.error('Backup restore failed:', error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore backup. Please check the file format.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRestoringBackup(false);
    }
  }, [createBackup, toast]);

  // Get local backup metadata
  const getLocalBackups = useCallback((): BackupMetadata[] => {
    try {
      const saved = localStorage.getItem('backup-metadata');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load backup metadata:', error);
      return [];
    }
  }, []);

  // Auto backup
  const autoBackup = useCallback(async () => {
    try {
      const lastBackup = localStorage.getItem('last-auto-backup');
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      if (!lastBackup || parseInt(lastBackup) < oneDayAgo) {
        await createBackup(`auto-backup-${new Date().toISOString().split('T')[0]}`);
        localStorage.setItem('last-auto-backup', now.toString());
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }, [createBackup]);

  // Clear old backups
  const cleanupOldBackups = useCallback(() => {
    try {
      const backups = getLocalBackups();
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const filtered = backups.filter(backup => backup.timestamp > oneWeekAgo);
      localStorage.setItem('backup-metadata', JSON.stringify(filtered));
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }, [getLocalBackups]);

  return {
    isCreatingBackup,
    isRestoringBackup,
    createBackup,
    restoreBackup,
    autoBackup,
    cleanupOldBackups,
    getLocalBackups,
  };
};