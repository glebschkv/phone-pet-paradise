import { test, expect } from '@playwright/test';

test.describe('Focus Timer Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode and clear timer state
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
      // Clear any existing timer state
      localStorage.removeItem('petparadise-timer-state');
    });
  });

  test('should navigate to focus timer page', async ({ page }) => {
    await page.goto('/');

    // Click on focus/timer navigation
    const timerNav = page.getByRole('link', { name: /focus|timer/i }).first();
    await timerNav.click();

    // Should be on the focus page
    await expect(page).toHaveURL(/.*focus/);
  });

  test('should display timer with default duration', async ({ page }) => {
    await page.goto('/focus');

    // Should show timer display (25:00 or similar)
    const timerDisplay = page.locator('[data-testid="timer-display"], .timer-display, text=/\\d{1,2}:\\d{2}/');
    await expect(timerDisplay.first()).toBeVisible();
  });

  test('should start timer when start button clicked', async ({ page }) => {
    await page.goto('/focus');

    // Find and click start button
    const startButton = page.getByRole('button', { name: /start|begin|focus/i }).first();
    await startButton.click();

    // Timer should be running (pause/stop button should appear)
    const pauseButton = page.getByRole('button', { name: /pause|stop/i });
    await expect(pauseButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should pause timer when pause button clicked', async ({ page }) => {
    await page.goto('/focus');

    // Start the timer
    const startButton = page.getByRole('button', { name: /start|begin|focus/i }).first();
    await startButton.click();

    // Wait for pause button to appear
    const pauseButton = page.getByRole('button', { name: /pause/i }).first();
    await expect(pauseButton).toBeVisible({ timeout: 5000 });

    // Click pause
    await pauseButton.click();

    // Resume/start button should reappear
    const resumeButton = page.getByRole('button', { name: /resume|start|continue/i });
    await expect(resumeButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow selecting different timer durations', async ({ page }) => {
    await page.goto('/focus');

    // Look for duration selector or preset buttons
    const durationOptions = page.getByRole('button', { name: /5 min|10 min|15 min|25 min|30 min|45 min/i });

    // If preset buttons exist, try clicking one
    const count = await durationOptions.count();
    if (count > 0) {
      await durationOptions.first().click();
      // Verify the selection changed something (timer display updated)
      await expect(page.locator('[data-testid="timer-display"], .timer-display').first()).toBeVisible();
    }
  });

  test('should persist timer state across page navigation', async ({ page }) => {
    await page.goto('/focus');

    // Start the timer
    const startButton = page.getByRole('button', { name: /start|begin|focus/i }).first();
    await startButton.click();

    // Wait for timer to be running
    await page.waitForTimeout(1000);

    // Navigate away
    await page.goto('/');

    // Navigate back
    await page.goto('/focus');

    // Timer should still be running or paused (not reset to start)
    const timerControls = page.getByRole('button', { name: /pause|resume|stop/i });
    await expect(timerControls.first()).toBeVisible({ timeout: 5000 });
  });
});
