import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { performanceLogger } from '@/lib/logger';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  isLowPerformance: boolean;
  loadTime: number;
  lastUpdate: number;
}

interface PerformanceSettings {
  targetFPS: number;
  maxMemoryMB: number;
  enableMonitoring: boolean;
  autoOptimize: boolean;
}

const defaultMetrics: PerformanceMetrics = {
  fps: 60,
  memoryUsage: 0,
  renderTime: 0,
  isLowPerformance: false,
  loadTime: 0,
  lastUpdate: Date.now(),
};

const defaultSettings: PerformanceSettings = {
  targetFPS: 60,
  maxMemoryMB: 512,
  enableMonitoring: true,
  autoOptimize: true,
};

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastOptimizationTime, setLastOptimizationTime] = useState(0);
  
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrame = useRef<number>();
  const { toast } = useToast();

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      frameCount.current = 0;
      lastTime.current = now;
      
      setMetrics(prev => ({
        ...prev,
        fps,
        lastUpdate: Date.now(),
        isLowPerformance: fps < settings.targetFPS * 0.7,
      }));
    }
    
    if (settings.enableMonitoring) {
      animationFrame.current = requestAnimationFrame(measureFPS);
    }
  }, [settings.enableMonitoring, settings.targetFPS]);

  // Memory monitoring
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      const memoryMB = memory.usedJSHeapSize / (1024 * 1024);
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memoryMB),
      }));
      
      // Warn if memory usage is high
      if (memoryMB > settings.maxMemoryMB * 0.8) {
        toast({
          title: "High Memory Usage",
          description: `App is using ${Math.round(memoryMB)}MB of memory`,
          variant: "destructive",
        });
      }
    }
  }, [settings.maxMemoryMB, toast]);

  // Auto-optimization with cooldown
  const optimizePerformance = useCallback(async () => {
    const now = Date.now();
    const OPTIMIZATION_COOLDOWN = 30000; // 30 seconds cooldown
    
    if (!settings.autoOptimize || isOptimizing || (now - lastOptimizationTime < OPTIMIZATION_COOLDOWN)) {
      return;
    }
    
    setIsOptimizing(true);
    setLastOptimizationTime(now);

    try {
      // Force garbage collection if available
      if ('gc' in window) {
        (window as unknown as { gc: () => void }).gc();
      }

      // Clear any large caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name =>
            name.includes('three') || name.includes('models')
              ? caches.delete(name)
              : Promise.resolve()
          )
        );
      }
      
      // Don't show toast for auto-optimizations to prevent spam
      performanceLogger.debug('Performance optimization completed automatically');
    } catch (error) {
      performanceLogger.error('Performance optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [settings.autoOptimize, isOptimizing, lastOptimizationTime]);

  // Start monitoring
  useEffect(() => {
    if (settings.enableMonitoring) {
      measureFPS();
      const memoryInterval = setInterval(measureMemory, 5000);
      
      return () => {
        if (animationFrame.current) {
          cancelAnimationFrame(animationFrame.current);
        }
        clearInterval(memoryInterval);
      };
    }
  }, [settings.enableMonitoring, measureFPS, measureMemory]);

  // Auto-optimize when performance is low
  useEffect(() => {
    if (metrics.isLowPerformance && settings.autoOptimize) {
      const timeout = setTimeout(optimizePerformance, 2000);
      return () => clearTimeout(timeout);
    }
  }, [metrics.isLowPerformance, settings.autoOptimize, optimizePerformance]);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('performance-settings');
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      performanceLogger.error('Failed to load performance settings:', error);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('performance-settings', JSON.stringify(updated));
    } catch (error) {
      performanceLogger.error('Failed to save performance settings:', error);
    }
  }, [settings]);

  const getPerformanceLevel = useCallback((): 'high' | 'medium' | 'low' => {
    if (metrics.fps >= settings.targetFPS * 0.9 && metrics.memoryUsage < settings.maxMemoryMB * 0.5) {
      return 'high';
    }
    if (metrics.fps >= settings.targetFPS * 0.7 && metrics.memoryUsage < settings.maxMemoryMB * 0.8) {
      return 'medium';
    }
    return 'low';
  }, [metrics.fps, metrics.memoryUsage, settings.targetFPS, settings.maxMemoryMB]);

  // Manual optimization (with toast)
  const manualOptimizePerformance = useCallback(async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setLastOptimizationTime(Date.now());
    
    try {
      // Force garbage collection if available
      if ('gc' in window) {
        (window as unknown as { gc: () => void }).gc();
      }

      // Clear any large caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(name =>
            name.includes('three') || name.includes('models')
              ? caches.delete(name)
              : Promise.resolve()
          )
        );
      }

      toast({
        title: "Performance Optimized",
        description: "Memory cleared and caches cleaned",
      });
    } catch (error) {
      performanceLogger.error('Performance optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [isOptimizing, toast]);

  return {
    metrics,
    settings,
    isOptimizing,
    performanceLevel: getPerformanceLevel(),
    updateSettings,
    optimizePerformance: manualOptimizePerformance,
    measureMemory,
  };
};