/**
 * Performance Monitor Component
 *
 * Development-only overlay showing real-time performance metrics.
 * Helps identify performance issues during development.
 *
 * Usage:
 * <PerformanceMonitor enabled={import.meta.env.DEV} />
 */

import { useState, useEffect, useCallback, memo } from 'react';
import { getSpriteAnimationManager } from '@/lib/spriteAnimationManager';
import { isIOS, getIOSVersion } from '@/lib/iosOptimizations';

interface PerformanceMetrics {
  fps: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  spriteAnimations: number;
  renderCount: number;
  lastRenderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const PerformanceMonitor = memo(({
  enabled = false,
  position = 'top-right',
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: null,
    spriteAnimations: 0,
    renderCount: 0,
    lastRenderTime: 0,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // FPS calculation
  const calculateFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        const spriteManager = getSpriteAnimationManager();

        setMetrics(prev => ({
          ...prev,
          fps,
          spriteAnimations: spriteManager.count,
          memory: getMemoryInfo(),
          renderCount: prev.renderCount + 1,
          lastRenderTime: currentTime,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      if (enabled) {
        requestAnimationFrame(countFrame);
      }
    };

    if (enabled) {
      requestAnimationFrame(countFrame);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      calculateFPS();
    }
  }, [enabled, calculateFPS]);

  if (!enabled) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '11px',
        lineHeight: '1.4',
        minWidth: isExpanded ? '200px' : '80px',
        cursor: 'pointer',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* FPS Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <FPSBadge fps={metrics.fps} />
        <span style={{ opacity: 0.7 }}>
          {metrics.spriteAnimations} sprites
        </span>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
          {/* Platform Info */}
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#888' }}>Platform: </span>
            <span>{isIOS() ? `iOS ${getIOSVersion() || 'Unknown'}` : 'Web'}</span>
          </div>

          {/* Memory */}
          {metrics.memory && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>Memory: </span>
              <span>
                {formatBytes(metrics.memory.usedJSHeapSize)} /
                {formatBytes(metrics.memory.jsHeapSizeLimit)}
              </span>
              <MemoryBar
                used={metrics.memory.usedJSHeapSize}
                limit={metrics.memory.jsHeapSizeLimit}
              />
            </div>
          )}

          {/* Render Count */}
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#888' }}>Renders: </span>
            <span>{metrics.renderCount}</span>
          </div>

          {/* Animation Manager Stats */}
          <div>
            <span style={{ color: '#888' }}>Manager FPS: </span>
            <span>{getSpriteAnimationManager().fps}</span>
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const FPSBadge = memo(({ fps }: { fps: number }) => {
  const color = fps >= 55 ? '#4ade80' : fps >= 30 ? '#fbbf24' : '#ef4444';

  return (
    <span style={{
      backgroundColor: color,
      color: '#000',
      padding: '2px 6px',
      borderRadius: '4px',
      fontWeight: 'bold',
      fontSize: '12px',
    }}>
      {fps} FPS
    </span>
  );
});

FPSBadge.displayName = 'FPSBadge';

const MemoryBar = memo(({ used, limit }: { used: number; limit: number }) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const color = percentage < 60 ? '#4ade80' : percentage < 80 ? '#fbbf24' : '#ef4444';

  return (
    <div style={{
      width: '100%',
      height: '4px',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '2px',
      marginTop: '4px',
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${percentage}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: '2px',
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
});

MemoryBar.displayName = 'MemoryBar';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMemoryInfo(): PerformanceMetrics['memory'] {
  // performance.memory is Chrome-specific
  const memory = (performance as { memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } }).memory;

  if (memory) {
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }

  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to track component render count
 * Useful for debugging unnecessary re-renders
 */
export function useRenderCount(componentName: string): number {
  const renderCountRef = { current: 0 };
  renderCountRef.current += 1;

  if (import.meta.env.DEV) {
    console.log(`[RenderCount] ${componentName}: ${renderCountRef.current}`);
  }

  return renderCountRef.current;
}

/**
 * Hook to log when props change
 */
export function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T
): void {
  const previousPropsRef = { current: props };

  if (import.meta.env.DEV) {
    const changedProps: string[] = [];

    for (const key in props) {
      if (props[key] !== previousPropsRef.current[key]) {
        changedProps.push(key);
      }
    }

    if (changedProps.length > 0) {
      console.log(`[WhyDidYouRender] ${componentName} re-rendered due to:`, changedProps);
    }

    previousPropsRef.current = props;
  }
}
