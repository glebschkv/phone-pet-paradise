import { registerPlugin } from '@capacitor/core';

export interface DeviceActivityPlugin {
  requestPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }>;
  checkPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }>;
  startMonitoring(): Promise<{ success: boolean; monitoring: boolean; startTime: number }>;
  stopMonitoring(): Promise<{ success: boolean; monitoring: boolean }>;
  getUsageData(): Promise<{ 
    timeAwayMinutes: number; 
    isMonitoring: boolean; 
    lastActiveTime: number; 
    currentTime: number 
  }>;
  recordActiveTime(): Promise<{ success: boolean; timestamp: number }>;
  triggerHapticFeedback(options: { style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' }): Promise<{ success: boolean }>;
}

const DeviceActivity = registerPlugin<DeviceActivityPlugin>('DeviceActivity', {
  web: () => import('./web').then(m => new m.DeviceActivityWeb()),
});

export * from './definitions';
export { DeviceActivity };