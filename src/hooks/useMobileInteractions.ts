import { useState, useEffect, useCallback } from 'react';
import { useDeviceActivity } from './useDeviceActivity';
import { useBackgroundProcessing } from './useBackgroundProcessing';
import { useNotifications } from './useNotifications';

interface HapticOptions {
  style?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
  pattern?: 'tap' | 'double-tap' | 'long-press' | 'success' | 'error';
}

interface MobileInteraction {
  isTouch: boolean;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  hasHapticSupport: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export const useMobileInteractions = () => {
  const [interaction, setInteraction] = useState<MobileInteraction>({
    isTouch: false,
    deviceType: 'desktop',
    hasHapticSupport: false,
    isIOS: false,
    isAndroid: false,
  });

  const { triggerHaptic } = useDeviceActivity();
  const { getSessionStats: _getSessionStats } = useBackgroundProcessing();
  const { scheduleRewardNotification } = useNotifications();

  // Detect device capabilities
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isMobile = isTouch && (isIOS || isAndroid);
    const isTablet = isTouch && !isMobile && window.innerWidth >= 768;
    
    setInteraction({
      isTouch,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      hasHapticSupport: isIOS || isAndroid || 'vibrate' in navigator,
      isIOS,
      isAndroid,
    });
  }, []);

  // Enhanced haptic feedback with patterns
  const hapticFeedback = useCallback(async (options: HapticOptions = {}) => {
    const { style = 'medium', pattern = 'tap' } = options;
    
    try {
      switch (pattern) {
        case 'double-tap':
          await triggerHaptic(style);
          setTimeout(() => triggerHaptic(style), 100);
          break;
        case 'long-press':
          await triggerHaptic('heavy');
          break;
        case 'success':
          await triggerHaptic('light');
          setTimeout(() => triggerHaptic('success'), 50);
          break;
        case 'error':
          await triggerHaptic('heavy');
          setTimeout(() => triggerHaptic('error'), 100);
          break;
        default:
          await triggerHaptic(style);
      }
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [triggerHaptic]);

  // Button interaction with haptic feedback
  const handleButtonPress = useCallback(async (action: string, options: HapticOptions = {}) => {
    await hapticFeedback(options);
    
    console.log(`Button pressed: ${action}`);
    
    // Track interaction analytics
    try {
      localStorage.setItem('last-interaction', JSON.stringify({
        action,
        timestamp: Date.now(),
        deviceType: interaction.deviceType,
      }));
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }, [hapticFeedback, interaction.deviceType]);

  // Reward interaction with enhanced feedback
  const handleRewardEarned = useCallback(async (xp: number, level?: number) => {
    // Play success haptic pattern
    await hapticFeedback({ pattern: 'success', style: 'success' });
    
    // Schedule notification
    scheduleRewardNotification(xp, level);
    
    // Visual feedback could be added here
    console.log(`Reward earned: ${xp} XP${level ? `, Level ${level}!` : ''}`);
  }, [hapticFeedback, scheduleRewardNotification]);

  // Error handling with haptic feedback
  const handleError = useCallback(async (message: string) => {
    await hapticFeedback({ pattern: 'error', style: 'error' });
    console.error('User error:', message);
  }, [hapticFeedback]);

  // Swipe gesture handling
  const createSwipeHandler = useCallback((
    onSwipeLeft?: () => void,
    onSwipeRight?: () => void,
    onSwipeUp?: () => void,
    onSwipeDown?: () => void
  ) => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = async (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 50;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          await hapticFeedback({ style: 'light' });
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          await hapticFeedback({ style: 'light' });
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }
    };
    
    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    };
  }, [hapticFeedback]);

  // Long press handler
  const createLongPressHandler = useCallback((
    onLongPress: () => void,
    duration = 500
  ) => {
    let timeout: NodeJS.Timeout;
    
    const handleStart = () => {
      timeout = setTimeout(async () => {
        await hapticFeedback({ pattern: 'long-press' });
        onLongPress();
      }, duration);
    };
    
    const handleEnd = () => {
      clearTimeout(timeout);
    };
    
    return {
      onMouseDown: handleStart,
      onMouseUp: handleEnd,
      onMouseLeave: handleEnd,
      onTouchStart: handleStart,
      onTouchEnd: handleEnd,
    };
  }, [hapticFeedback]);

  // Pull to refresh handler
  const createPullToRefreshHandler = useCallback((
    onRefresh: () => void,
    threshold = 80
  ) => {
    let startY = 0;
    let isPulling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };
    
    const handleTouchMove = async (e: TouchEvent) => {
      if (!isPulling) return;
      
      const currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      if (pullDistance > threshold) {
        await hapticFeedback({ style: 'medium' });
        isPulling = false;
        onRefresh();
      }
    };
    
    const handleTouchEnd = () => {
      isPulling = false;
    };
    
    return {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    };
  }, [hapticFeedback]);

  return {
    interaction,
    hapticFeedback,
    handleButtonPress,
    handleRewardEarned,
    handleError,
    createSwipeHandler,
    createLongPressHandler,
    createPullToRefreshHandler,
  };
};