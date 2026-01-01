import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the Capacitor plugin
vi.mock('@/plugins/device-activity', () => ({
  DeviceActivity: {
    checkPermissions: vi.fn().mockResolvedValue({ status: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ status: 'granted' }),
    startMonitoring: vi.fn().mockResolvedValue({ monitoring: true }),
    stopMonitoring: vi.fn().mockResolvedValue({ success: true }),
    startAppBlocking: vi.fn().mockResolvedValue({
      success: true,
      appsBlocked: 4,
      categoriesBlocked: 2,
      domainsBlocked: 0,
    }),
    stopAppBlocking: vi.fn().mockResolvedValue({
      success: true,
      shieldAttempts: 0,
    }),
    getBlockingStatus: vi.fn().mockResolvedValue({
      isBlocking: false,
      focusSessionActive: false,
      shieldAttempts: 0,
      lastShieldAttemptTimestamp: 0,
      hasAppsConfigured: true,
    }),
    getShieldAttempts: vi.fn().mockResolvedValue({
      attempts: 0,
      lastAttemptTimestamp: 0,
    }),
    resetShieldAttempts: vi.fn().mockResolvedValue({ success: true }),
    openAppPicker: vi.fn().mockResolvedValue({ success: true }),
    setSelectedApps: vi.fn().mockResolvedValue({ success: true }),
    getSelectedApps: vi.fn().mockResolvedValue({ hasSelection: true, selection: '[]' }),
    clearSelectedApps: vi.fn().mockResolvedValue({ success: true }),
    getUsageData: vi.fn().mockResolvedValue({
      timeAwayMinutes: 0,
      isMonitoring: true,
      lastActiveTime: Date.now(),
      shieldAttempts: 0,
    }),
    recordActiveTime: vi.fn().mockResolvedValue({ success: true }),
    triggerHapticFeedback: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'ios',
  },
}));

// Import after mocks
import { useDeviceActivity, DEFAULT_BLOCKED_APPS } from '@/hooks/useDeviceActivity';
import { DeviceActivity } from '@/plugins/device-activity';

describe('useDeviceActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isNative).toBe(true);
    expect(result.current.simulatedApps).toHaveLength(DEFAULT_BLOCKED_APPS.length);
  });

  it('should check permissions on mount', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(DeviceActivity.checkPermissions).toHaveBeenCalled();
  });

  it('should request permissions correctly', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.requestPermissions();
    });

    expect(DeviceActivity.requestPermissions).toHaveBeenCalled();
    expect(result.current.isPermissionGranted).toBe(true);
  });

  it('should start app blocking', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const blockingResult = await result.current.startAppBlocking();
      expect(blockingResult.success).toBe(true);
      expect(blockingResult.appsBlocked).toBe(4);
    });

    expect(DeviceActivity.startAppBlocking).toHaveBeenCalled();
    expect(result.current.isBlocking).toBe(true);
  });

  it('should stop app blocking and return shield attempts', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start blocking first
    await act(async () => {
      await result.current.startAppBlocking();
    });

    // Then stop
    await act(async () => {
      const stopResult = await result.current.stopAppBlocking();
      expect(stopResult.success).toBe(true);
    });

    expect(DeviceActivity.stopAppBlocking).toHaveBeenCalled();
    expect(result.current.isBlocking).toBe(false);
  });

  it('should toggle blocked app status', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const appId = 'instagram';
    const initialBlocked = result.current.simulatedApps.find(
      (app) => app.id === appId
    )?.isBlocked;

    act(() => {
      result.current.toggleAppBlocked(appId, !initialBlocked);
    });

    const updatedApp = result.current.simulatedApps.find((app) => app.id === appId);
    expect(updatedApp?.isBlocked).toBe(!initialBlocked);
  });

  it('should count blocked apps correctly', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const blockedCount = result.current.simulatedApps.filter((app) => app.isBlocked).length;
    expect(result.current.blockedAppsCount).toBe(blockedCount);
  });

  it('should trigger haptic feedback', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.triggerHaptic('success');
    });

    expect(DeviceActivity.triggerHapticFeedback).toHaveBeenCalledWith({ style: 'success' });
  });

  it('should clear selected apps', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.clearSelectedApps();
    });

    expect(DeviceActivity.clearSelectedApps).toHaveBeenCalled();
    expect(result.current.hasAppsConfigured).toBe(false);
  });

  it('should persist app selection to localStorage', async () => {
    const { result } = renderHook(() => useDeviceActivity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newApps = [...DEFAULT_BLOCKED_APPS].map((app) => ({
      ...app,
      isBlocked: true,
    }));

    act(() => {
      result.current.updateSimulatedApps(newApps);
    });

    const stored = localStorage.getItem('nomoPhone_selectedApps');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toHaveLength(newApps.length);
  });
});
