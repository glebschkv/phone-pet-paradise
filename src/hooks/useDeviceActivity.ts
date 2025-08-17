import { useState, useEffect, useCallback } from 'react';
import { DeviceActivity } from '@/plugins/device-activity';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

interface DeviceActivityState {
  isPermissionGranted: boolean;
  isMonitoring: boolean;
  timeAwayMinutes: number;
  lastActiveTime: number;
  isLoading: boolean;
}

interface AppLifecycleEvent {
  state: 'active' | 'background' | 'foreground' | 'terminated';
  timestamp: number;
  timeAwayMinutes?: number;
  lastActiveTime?: number;
}

export const useDeviceActivity = () => {
  const [state, setState] = useState<DeviceActivityState>({
    isPermissionGranted: false,
    isMonitoring: false,
    timeAwayMinutes: 0,
    lastActiveTime: Date.now(),
    isLoading: true,
  });
  
  const { toast } = useToast();

  // Initialize device activity monitoring
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Check permissions
      const permissions = await DeviceActivity.checkPermissions();
      setState(prev => ({ 
        ...prev, 
        isPermissionGranted: permissions.status === 'granted' 
      }));

      if (permissions.status === 'granted') {
        // Start monitoring if permissions granted
        const monitoring = await DeviceActivity.startMonitoring();
        setState(prev => ({ 
          ...prev, 
          isMonitoring: monitoring.monitoring 
        }));
        
        if (Capacitor.isNativePlatform()) {
          toast({
            title: "Device Tracking Active",
            description: "Your phone usage is being monitored for rewards",
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize device activity:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to start device activity monitoring",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const result = await DeviceActivity.requestPermissions();
      setState(prev => ({ 
        ...prev, 
        isPermissionGranted: result.status === 'granted' 
      }));

      if (result.status === 'granted') {
        // Start monitoring after permissions granted
        const monitoring = await DeviceActivity.startMonitoring();
        setState(prev => ({ 
          ...prev, 
          isMonitoring: monitoring.monitoring 
        }));
        
        toast({
          title: "Permissions Granted",
          description: "Device activity tracking is now enabled",
        });
      } else {
        toast({
          title: "Permissions Denied",
          description: "Device tracking requires Screen Time permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request device activity permissions",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  // Get current usage data
  const getUsageData = useCallback(async () => {
    try {
      const data = await DeviceActivity.getUsageData();
      setState(prev => ({
        ...prev,
        timeAwayMinutes: data.timeAwayMinutes,
        lastActiveTime: data.lastActiveTime,
        isMonitoring: data.isMonitoring,
      }));
      return data;
    } catch (error) {
      console.error('Failed to get usage data:', error);
      return null;
    }
  }, []);

  // Record active time
  const recordActiveTime = useCallback(async () => {
    try {
      await DeviceActivity.recordActiveTime();
      setState(prev => ({ ...prev, lastActiveTime: Date.now() }));
    } catch (error) {
      console.error('Failed to record active time:', error);
    }
  }, []);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    try {
      await DeviceActivity.triggerHapticFeedback({ style });
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, []);

  // Handle app lifecycle events
  useEffect(() => {
    const handleAppLifecycle = (event: CustomEvent<AppLifecycleEvent>) => {
      const { state: appState, timeAwayMinutes, timestamp } = event.detail;
      
      console.log('App lifecycle change:', appState, timeAwayMinutes);
      
      setState(prev => ({
        ...prev,
        timeAwayMinutes: timeAwayMinutes || prev.timeAwayMinutes,
        lastActiveTime: timestamp,
      }));

      // Trigger haptic feedback for certain events
      if (appState === 'active' && timeAwayMinutes && timeAwayMinutes > 5) {
        triggerHaptic('success');
      }
    };

    // Listen for app lifecycle events from native
    window.addEventListener('appLifecycleChange', handleAppLifecycle as EventListener);
    
    return () => {
      window.removeEventListener('appLifecycleChange', handleAppLifecycle as EventListener);
    };
  }, [triggerHaptic]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Periodic usage data refresh
  useEffect(() => {
    if (state.isMonitoring) {
      const interval = setInterval(getUsageData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [state.isMonitoring, getUsageData]);

  return {
    ...state,
    requestPermissions,
    getUsageData,
    recordActiveTime,
    triggerHaptic,
    initialize,
  };
};