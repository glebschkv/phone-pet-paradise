import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ARIA_LABELS,
  ROLE_DESCRIPTIONS,
  ANNOUNCEMENTS,
  announceToScreenReader,
  formatTimeForScreenReader,
  getProgressLabel,
  getXPProgressLabel,
  getStreakLabel,
  getTimerLabel,
  prefersReducedMotion,
  prefersHighContrast,
  trapFocus,
  handleGridNavigation,
  accessibilityStyles,
} from '@/lib/accessibility';

describe('Accessibility Utilities', () => {
  describe('ARIA_LABELS', () => {
    it('should have navigation labels', () => {
      expect(ARIA_LABELS.CLOSE_MODAL).toBe('Close dialog');
      expect(ARIA_LABELS.OPEN_MENU).toBe('Open menu');
      expect(ARIA_LABELS.GO_BACK).toBe('Go back');
      expect(ARIA_LABELS.HOME).toBe('Go to home screen');
    });

    it('should have timer action labels', () => {
      expect(ARIA_LABELS.START_TIMER).toBe('Start focus session');
      expect(ARIA_LABELS.PAUSE_TIMER).toBe('Pause focus session');
      expect(ARIA_LABELS.RESUME_TIMER).toBe('Resume focus session');
      expect(ARIA_LABELS.STOP_TIMER).toBe('Stop focus session');
    });

    it('should have pet interaction labels', () => {
      expect(ARIA_LABELS.PET_ANIMAL).toBe('Pet the animal');
      expect(ARIA_LABELS.FEED_ANIMAL).toBe('Feed the animal');
      expect(ARIA_LABELS.SELECT_PET).toBe('Select this pet');
    });

    it('should have shop labels', () => {
      expect(ARIA_LABELS.PURCHASE_ITEM).toBe('Purchase this item');
      expect(ARIA_LABELS.SPIN_WHEEL).toBe('Spin the lucky wheel');
      expect(ARIA_LABELS.CLAIM_REWARD).toBe('Claim reward');
    });

    it('should have settings labels', () => {
      expect(ARIA_LABELS.TOGGLE_SOUND).toBe('Toggle sound effects');
      expect(ARIA_LABELS.TOGGLE_NOTIFICATIONS).toBe('Toggle notifications');
      expect(ARIA_LABELS.CHANGE_THEME).toBe('Change app theme');
    });
  });

  describe('ROLE_DESCRIPTIONS', () => {
    it('should have display role descriptions', () => {
      expect(ROLE_DESCRIPTIONS.TIMER_DISPLAY).toBe('Focus timer display');
      expect(ROLE_DESCRIPTIONS.XP_BAR).toBe('Experience points progress bar');
      expect(ROLE_DESCRIPTIONS.STREAK_DISPLAY).toBe('Current streak counter');
      expect(ROLE_DESCRIPTIONS.COIN_DISPLAY).toBe('Coin balance display');
    });

    it('should have collection role descriptions', () => {
      expect(ROLE_DESCRIPTIONS.PET_GRID).toBe('Pet collection grid');
      expect(ROLE_DESCRIPTIONS.SHOP_ITEM).toBe('Shop item for purchase');
      expect(ROLE_DESCRIPTIONS.ACHIEVEMENT_BADGE).toBe('Achievement badge');
    });
  });

  describe('ANNOUNCEMENTS', () => {
    it('should have timer announcements', () => {
      expect(ANNOUNCEMENTS.TIMER_STARTED).toBe('Focus session started');
      expect(ANNOUNCEMENTS.TIMER_PAUSED).toBe('Focus session paused');
      expect(ANNOUNCEMENTS.TIMER_COMPLETED).toBe('Focus session completed! Great job!');
    });

    it('should have dynamic achievement announcement', () => {
      expect(ANNOUNCEMENTS.ACHIEVEMENT_UNLOCKED('Test Badge')).toBe('Achievement unlocked: Test Badge');
    });

    it('should have dynamic level up announcement', () => {
      expect(ANNOUNCEMENTS.LEVEL_UP(5)).toBe('Congratulations! You reached level 5!');
    });

    it('should have dynamic XP and coin announcements', () => {
      expect(ANNOUNCEMENTS.XP_EARNED(100)).toBe('You earned 100 experience points');
      expect(ANNOUNCEMENTS.COINS_EARNED(50)).toBe('You earned 50 coins');
    });

    it('should have dynamic streak announcements', () => {
      expect(ANNOUNCEMENTS.STREAK_CONTINUED(7)).toBe('Streak continued! 7 days strong!');
      expect(ANNOUNCEMENTS.STREAK_LOST).toBe('Your streak has been reset');
    });

    it('should have dynamic purchase announcements', () => {
      expect(ANNOUNCEMENTS.PURCHASE_SUCCESS('Cool Hat')).toBe('Successfully purchased Cool Hat');
      expect(ANNOUNCEMENTS.PURCHASE_FAILED).toBe('Purchase failed. Please try again.');
      expect(ANNOUNCEMENTS.INSUFFICIENT_COINS).toBe('Not enough coins for this purchase');
    });

    it('should have loading state announcements', () => {
      expect(ANNOUNCEMENTS.LOADING).toBe('Loading...');
      expect(ANNOUNCEMENTS.SAVING).toBe('Saving...');
      expect(ANNOUNCEMENTS.SYNCING).toBe('Syncing data...');
    });
  });

  describe('announceToScreenReader', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      // Clean up any remaining elements
      document.querySelectorAll('[aria-live]').forEach(el => el.remove());
    });

    it('should create announcement element with polite priority by default', () => {
      announceToScreenReader('Test message');

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).not.toBeNull();
      expect(announcement?.textContent).toBe('Test message');
      expect(announcement?.getAttribute('role')).toBe('status');
      expect(announcement?.getAttribute('aria-atomic')).toBe('true');
      expect(announcement?.className).toBe('sr-only');
    });

    it('should create announcement element with assertive priority', () => {
      announceToScreenReader('Urgent message', 'assertive');

      const announcement = document.querySelector('[aria-live="assertive"]');
      expect(announcement).not.toBeNull();
      expect(announcement?.textContent).toBe('Urgent message');
      expect(announcement?.getAttribute('role')).toBe('alert');
    });

    it('should remove announcement element after 1 second', () => {
      announceToScreenReader('Temporary message');

      expect(document.querySelector('[aria-live]')).not.toBeNull();

      vi.advanceTimersByTime(1000);

      expect(document.querySelector('[aria-live="polite"]')).toBeNull();
    });
  });

  describe('formatTimeForScreenReader', () => {
    it('should format seconds only', () => {
      expect(formatTimeForScreenReader(30)).toBe('30 seconds');
      expect(formatTimeForScreenReader(1)).toBe('1 second');
      expect(formatTimeForScreenReader(0)).toBe('0 seconds');
    });

    it('should format minutes and seconds', () => {
      expect(formatTimeForScreenReader(90)).toBe('1 minute and 30 seconds');
      expect(formatTimeForScreenReader(120)).toBe('2 minutes');
      expect(formatTimeForScreenReader(61)).toBe('1 minute and 1 second');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatTimeForScreenReader(3661)).toBe('1 hour and 1 minute and 1 second');
      expect(formatTimeForScreenReader(7200)).toBe('2 hours');
      expect(formatTimeForScreenReader(3700)).toBe('1 hour and 1 minute and 40 seconds');
    });

    it('should handle edge cases', () => {
      expect(formatTimeForScreenReader(3600)).toBe('1 hour');
      expect(formatTimeForScreenReader(3660)).toBe('1 hour and 1 minute');
      expect(formatTimeForScreenReader(60)).toBe('1 minute');
    });
  });

  describe('getProgressLabel', () => {
    it('should generate progress label with percentage', () => {
      expect(getProgressLabel(50, 100, 'XP')).toBe('XP: 50 of 100, 50% complete');
      expect(getProgressLabel(0, 100, 'Progress')).toBe('Progress: 0 of 100, 0% complete');
      expect(getProgressLabel(100, 100, 'Level')).toBe('Level: 100 of 100, 100% complete');
    });

    it('should round percentage', () => {
      expect(getProgressLabel(1, 3, 'Tasks')).toBe('Tasks: 1 of 3, 33% complete');
      expect(getProgressLabel(2, 3, 'Items')).toBe('Items: 2 of 3, 67% complete');
    });
  });

  describe('getXPProgressLabel', () => {
    it('should generate XP progress label', () => {
      expect(getXPProgressLabel(50, 50, 5)).toBe('Level 5, 50 XP, 50% to next level');
      expect(getXPProgressLabel(0, 100, 1)).toBe('Level 1, 0 XP, 0% to next level');
    });

    it('should handle edge cases', () => {
      expect(getXPProgressLabel(99, 1, 10)).toBe('Level 10, 99 XP, 99% to next level');
    });
  });

  describe('getStreakLabel', () => {
    it('should generate streak label without freezes', () => {
      expect(getStreakLabel(5, 0)).toBe('Current streak: 5 days');
      expect(getStreakLabel(1, 0)).toBe('Current streak: 1 day');
    });

    it('should generate streak label with freezes', () => {
      expect(getStreakLabel(10, 2)).toBe('Current streak: 10 days, 2 freezes available');
      expect(getStreakLabel(7, 1)).toBe('Current streak: 7 days, 1 freeze available');
    });

    it('should handle zero streak', () => {
      expect(getStreakLabel(0, 3)).toBe('Current streak: 0 days, 3 freezes available');
    });
  });

  describe('getTimerLabel', () => {
    it('should generate timer label for running timer', () => {
      const label = getTimerLabel(1500, true, 'Focus');
      expect(label).toBe('Focus timer running, 25 minutes remaining');
    });

    it('should generate timer label for paused timer', () => {
      const label = getTimerLabel(300, false, 'Break');
      expect(label).toBe('Break timer paused, 5 minutes remaining');
    });

    it('should default to focus when sessionType is null', () => {
      const label = getTimerLabel(60, true, null);
      expect(label).toBe('focus timer running, 1 minute remaining');
    });
  });

  describe('prefersReducedMotion', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      matchMediaMock = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        writable: true,
      });
    });

    it('should return true when reduced motion is preferred', () => {
      matchMediaMock.mockReturnValue({ matches: true });
      expect(prefersReducedMotion()).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('should return false when reduced motion is not preferred', () => {
      matchMediaMock.mockReturnValue({ matches: false });
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('prefersHighContrast', () => {
    let matchMediaMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      matchMediaMock = vi.fn();
      Object.defineProperty(window, 'matchMedia', {
        value: matchMediaMock,
        writable: true,
      });
    });

    it('should return true when high contrast is preferred', () => {
      matchMediaMock.mockReturnValue({ matches: true });
      expect(prefersHighContrast()).toBe(true);
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-contrast: more)');
    });

    it('should return false when high contrast is not preferred', () => {
      matchMediaMock.mockReturnValue({ matches: false });
      expect(prefersHighContrast()).toBe(false);
    });
  });

  describe('trapFocus', () => {
    let container: HTMLDivElement;
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      button1 = document.createElement('button');
      button2 = document.createElement('button');
      button3 = document.createElement('button');

      button1.textContent = 'First';
      button2.textContent = 'Second';
      button3.textContent = 'Third';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should focus first element on init', () => {
      trapFocus(container);
      expect(document.activeElement).toBe(button1);
    });

    it('should trap focus at the end - wrap to first', () => {
      trapFocus(container);
      button3.focus();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      container.dispatchEvent(tabEvent);

      // Focus should wrap to first
      expect(document.activeElement).toBe(button1);
    });

    it('should trap focus at the beginning - wrap to last', () => {
      trapFocus(container);
      button1.focus();

      const shiftTabEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true
      });
      container.dispatchEvent(shiftTabEvent);

      expect(document.activeElement).toBe(button3);
    });

    it('should return cleanup function that removes listener', () => {
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener');
      const cleanup = trapFocus(container);

      cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should ignore non-tab keys', () => {
      trapFocus(container);
      button2.focus();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      container.dispatchEvent(enterEvent);

      expect(document.activeElement).toBe(button2);
    });
  });

  describe('handleGridNavigation', () => {
    let preventDefaultMock: ReturnType<typeof vi.fn>;
    let onNavigateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      preventDefaultMock = vi.fn();
      onNavigateMock = vi.fn();
    });

    const createKeyEvent = (key: string): React.KeyboardEvent => ({
      key,
      preventDefault: preventDefaultMock,
    } as unknown as React.KeyboardEvent);

    it('should navigate right', () => {
      handleGridNavigation(createKeyEvent('ArrowRight'), 0, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(1);
      expect(preventDefaultMock).toHaveBeenCalled();
    });

    it('should not navigate right past last item', () => {
      handleGridNavigation(createKeyEvent('ArrowRight'), 8, 9, 3, onNavigateMock);
      expect(onNavigateMock).not.toHaveBeenCalled();
    });

    it('should navigate left', () => {
      handleGridNavigation(createKeyEvent('ArrowLeft'), 5, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(4);
    });

    it('should not navigate left past first item', () => {
      handleGridNavigation(createKeyEvent('ArrowLeft'), 0, 9, 3, onNavigateMock);
      expect(onNavigateMock).not.toHaveBeenCalled();
    });

    it('should navigate down by column count', () => {
      handleGridNavigation(createKeyEvent('ArrowDown'), 1, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(4);
    });

    it('should not navigate down past last row', () => {
      handleGridNavigation(createKeyEvent('ArrowDown'), 7, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(8); // Moves to last item
    });

    it('should navigate up by column count', () => {
      handleGridNavigation(createKeyEvent('ArrowUp'), 4, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(1);
    });

    it('should clamp navigation to first item when going up from first row', () => {
      // From index 1, ArrowUp goes to max(1-3, 0) = 0
      handleGridNavigation(createKeyEvent('ArrowUp'), 1, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(0);
    });

    it('should not navigate up when already at first item', () => {
      handleGridNavigation(createKeyEvent('ArrowUp'), 0, 9, 3, onNavigateMock);
      expect(onNavigateMock).not.toHaveBeenCalled();
    });

    it('should navigate to first item with Home', () => {
      handleGridNavigation(createKeyEvent('Home'), 5, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(0);
    });

    it('should navigate to last item with End', () => {
      handleGridNavigation(createKeyEvent('End'), 2, 9, 3, onNavigateMock);
      expect(onNavigateMock).toHaveBeenCalledWith(8);
    });

    it('should ignore unknown keys', () => {
      handleGridNavigation(createKeyEvent('Enter'), 5, 9, 3, onNavigateMock);
      expect(onNavigateMock).not.toHaveBeenCalled();
      expect(preventDefaultMock).not.toHaveBeenCalled();
    });
  });

  describe('accessibilityStyles', () => {
    it('should contain sr-only class', () => {
      expect(accessibilityStyles).toContain('.sr-only');
      expect(accessibilityStyles).toContain('position: absolute');
    });

    it('should contain focus-visible styles', () => {
      expect(accessibilityStyles).toContain('.focus-visible');
      expect(accessibilityStyles).toContain('outline');
    });

    it('should contain skip-link styles', () => {
      expect(accessibilityStyles).toContain('.skip-link');
    });

    it('should contain reduced motion media query', () => {
      expect(accessibilityStyles).toContain('@media (prefers-reduced-motion: reduce)');
      expect(accessibilityStyles).toContain('animation-duration: 0.01ms');
    });
  });
});
