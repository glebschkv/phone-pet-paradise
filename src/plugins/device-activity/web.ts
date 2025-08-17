import { WebPlugin } from '@capacitor/core';
import type { DeviceActivityPlugin } from './definitions';

export class DeviceActivityWeb extends WebPlugin implements DeviceActivityPlugin {
  private isMonitoring = false;
  private lastActiveTime = Date.now();
  private sessionStartTime = Date.now();

  async requestPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }> {
    console.log('DeviceActivity Web: Permissions requested (simulation)');
    return { status: 'granted', familyControlsEnabled: false };
  }

  async checkPermissions(): Promise<{ status: string; familyControlsEnabled: boolean }> {
    return { status: 'granted', familyControlsEnabled: false };
  }

  async startMonitoring(): Promise<{ success: boolean; monitoring: boolean; startTime: number }> {
    this.isMonitoring = true;
    this.sessionStartTime = Date.now();
    console.log('DeviceActivity Web: Started monitoring (simulation)');
    
    // Simulate app lifecycle events
    this.setupWebLifecycleListeners();
    
    return { 
      success: true, 
      monitoring: true, 
      startTime: this.sessionStartTime 
    };
  }

  async stopMonitoring(): Promise<{ success: boolean; monitoring: boolean }> {
    this.isMonitoring = false;
    console.log('DeviceActivity Web: Stopped monitoring');
    return { success: true, monitoring: false };
  }

  async getUsageData(): Promise<{ 
    timeAwayMinutes: number; 
    isMonitoring: boolean; 
    lastActiveTime: number; 
    currentTime: number 
  }> {
    const now = Date.now();
    const timeAwayMinutes = (now - this.lastActiveTime) / (1000 * 60);
    
    return {
      timeAwayMinutes,
      isMonitoring: this.isMonitoring,
      lastActiveTime: this.lastActiveTime,
      currentTime: now
    };
  }

  async recordActiveTime(): Promise<{ success: boolean; timestamp: number }> {
    this.lastActiveTime = Date.now();
    return { success: true, timestamp: this.lastActiveTime };
  }

  async triggerHapticFeedback(options: { style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' }): Promise<{ success: boolean }> {
    // Web haptic feedback simulation
    if ('vibrate' in navigator) {
      switch (options.style) {
        case 'light':
          navigator.vibrate(50);
          break;
        case 'medium':
          navigator.vibrate(100);
          break;
        case 'heavy':
          navigator.vibrate(200);
          break;
        case 'success':
          navigator.vibrate([50, 50, 100]);
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'error':
          navigator.vibrate([200, 100, 200]);
          break;
        default:
          navigator.vibrate(100);
      }
    }
    
    console.log(`DeviceActivity Web: Haptic feedback (${options.style})`);
    return { success: true };
  }

  private setupWebLifecycleListeners() {
    // Page visibility API for web
    document.addEventListener('visibilitychange', () => {
      const now = Date.now();
      
      if (document.hidden) {
        this.lastActiveTime = now;
        this.notifyListeners('appLifecycleChange', {
          state: 'background',
          timestamp: now,
          lastActiveTime: this.lastActiveTime
        });
      } else {
        const timeAwayMinutes = (now - this.lastActiveTime) / (1000 * 60);
        this.notifyListeners('appLifecycleChange', {
          state: 'active',
          timestamp: now,
          timeAwayMinutes,
          lastActiveTime: this.lastActiveTime
        });
        this.lastActiveTime = now;
      }
    });

    // Beforeunload for app termination
    window.addEventListener('beforeunload', () => {
      this.lastActiveTime = Date.now();
      this.notifyListeners('appLifecycleChange', {
        state: 'terminated',
        timestamp: this.lastActiveTime
      });
    });
  }
}