/**
 * iOS Performance Optimizations
 *
 * Utilities for improving iOS-specific performance in the hybrid app.
 * These optimizations target common iOS WebView performance issues.
 */

import { Capacitor } from '@capacitor/core';

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

/**
 * Check if running on iOS (native or Safari)
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios' ||
    /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * Check if running as a native Capacitor app
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get iOS version if running on iOS
 */
export function getIOSVersion(): number | null {
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================================
// CSS PERFORMANCE HINTS
// ============================================================================

/**
 * CSS properties that hint to the browser about upcoming changes
 * Apply these to elements that will animate
 */
export const CSS_PERFORMANCE_HINTS = {
  // Use for elements that will translate/rotate/scale
  transform: {
    willChange: 'transform',
    transform: 'translateZ(0)', // Force GPU layer
    backfaceVisibility: 'hidden' as const,
  },

  // Use for elements with changing opacity
  opacity: {
    willChange: 'opacity',
    transform: 'translateZ(0)',
  },

  // Use for scrollable containers
  scroll: {
    willChange: 'scroll-position',
    WebkitOverflowScrolling: 'touch', // Momentum scrolling on iOS
    overscrollBehavior: 'contain' as const,
  },

  // Use for animated sprites
  sprite: {
    willChange: 'background-position',
    transform: 'translateZ(0)',
    imageRendering: 'pixelated' as const,
  },
};

// ============================================================================
// TOUCH HANDLING
// ============================================================================

/**
 * Disable the 300ms tap delay on iOS
 * Modern iOS versions handle this automatically with touch-action: manipulation
 */
export function applyTouchOptimizations(element: HTMLElement): void {
  element.style.touchAction = 'manipulation';
  element.style.webkitTouchCallout = 'none';
  element.style.webkitUserSelect = 'none';
}

/**
 * CSS class for touch-optimized buttons
 */
export const TOUCH_OPTIMIZED_STYLES = `
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
`;

// ============================================================================
// SCROLL PERFORMANCE
// ============================================================================

/**
 * Apply iOS-optimized scroll behavior to a container
 */
export function optimizeScrollContainer(element: HTMLElement): void {
  // Enable momentum scrolling
  element.style.webkitOverflowScrolling = 'touch';

  // Prevent scroll chaining (overscroll affecting parent)
  element.style.overscrollBehavior = 'contain';

  // Hint to browser about scroll
  element.style.willChange = 'scroll-position';
}

/**
 * Prevent iOS rubber-banding on non-scrollable content
 */
export function preventRubberBanding(element: HTMLElement): void {
  element.addEventListener('touchmove', (e) => {
    if (element.scrollHeight <= element.clientHeight) {
      e.preventDefault();
    }
  }, { passive: false });
}

// ============================================================================
// ANIMATION OPTIMIZATIONS
// ============================================================================

/**
 * Reduce motion preference detection
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get optimal animation frame rate based on device capabilities
 */
export function getOptimalFrameRate(): 30 | 60 {
  // On older iOS devices or when battery is low, use 30fps
  const iosVersion = getIOSVersion();
  if (iosVersion && iosVersion < 15) {
    return 30;
  }

  // Check if reduced motion is preferred
  if (prefersReducedMotion()) {
    return 30;
  }

  return 60;
}

/**
 * Request idle callback with iOS fallback
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  // iOS Safari doesn't support requestIdleCallback, use setTimeout fallback
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    });
  }, 1) as unknown as number;
}

/**
 * Cancel idle callback with iOS fallback
 */
export function cancelIdleCallback(handle: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
  } else {
    window.clearTimeout(handle);
  }
}

// ============================================================================
// MEMORY MANAGEMENT
// ============================================================================

/**
 * Force garbage collection hint (not guaranteed to work)
 * Use sparingly - only when transitioning between major app states
 */
export function hintGarbageCollection(): void {
  // Create and immediately discard a large array to hint GC
  // This is a soft hint, not a guarantee
  try {
    const arr = new Array(1000000);
    arr.length = 0;
  } catch {
    // Ignore memory errors
  }
}

/**
 * Clear image cache hint
 * Useful when switching between views with many images
 */
export function clearImageCache(): void {
  // Force reload of cached images by appending timestamp
  // This is a workaround, not a direct cache clear
  document.querySelectorAll('img').forEach((img) => {
    const src = img.src;
    if (src && !src.includes('?t=')) {
      img.src = `${src}?t=${Date.now()}`;
    }
  });
}

// ============================================================================
// KEYBOARD HANDLING
// ============================================================================

/**
 * Optimize virtual keyboard behavior on iOS
 */
export function setupKeyboardOptimizations(): () => void {
  const visualViewport = window.visualViewport;

  if (!visualViewport) {
    return () => {};
  }

  const handleResize = () => {
    // Adjust viewport when keyboard shows/hides
    const keyboardHeight = window.innerHeight - visualViewport.height;
    document.documentElement.style.setProperty(
      '--keyboard-height',
      `${keyboardHeight}px`
    );
  };

  visualViewport.addEventListener('resize', handleResize);

  return () => {
    visualViewport.removeEventListener('resize', handleResize);
  };
}

// ============================================================================
// SAFE AREA HANDLING
// ============================================================================

/**
 * Get iOS safe area insets
 */
export function getSafeAreaInsets(): {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const style = getComputedStyle(document.documentElement);

  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
  };
}

/**
 * Apply safe area CSS custom properties
 */
export function setupSafeAreaProperties(): void {
  // These CSS custom properties can be used throughout the app
  const css = `
    :root {
      --sat: env(safe-area-inset-top);
      --sar: env(safe-area-inset-right);
      --sab: env(safe-area-inset-bottom);
      --sal: env(safe-area-inset-left);
    }
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Apply all iOS optimizations
 * Call this once at app startup
 */
export function initializeIOSOptimizations(): () => void {
  if (!isIOS()) {
    return () => {};
  }

  // Set up safe area properties
  setupSafeAreaProperties();

  // Set up keyboard handling
  const cleanupKeyboard = setupKeyboardOptimizations();

  // Apply touch optimizations to body
  applyTouchOptimizations(document.body);

  // Return cleanup function
  return () => {
    cleanupKeyboard();
  };
}
