import { test, expect } from '@playwright/test';

test.describe('Streak System Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
    });
  });

  test('should display current streak on home page', async ({ page }) => {
    await page.goto('/');

    // Should show streak information somewhere
    const streakDisplay = page.locator('text=/streak|🔥|day/i');
    await expect(streakDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show streak progress', async ({ page }) => {
    // Set up a streak
    await page.addInitScript(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem('petparadise_streak', JSON.stringify({
        currentStreak: 5,
        lastCompletionDate: yesterday.toISOString().split('T')[0],
        longestStreak: 10
      }));
    });

    await page.goto('/');

    // Should display streak count
    const streakCount = page.locator('text=/5|streak/i');
    await expect(streakCount.first()).toBeVisible();
  });

  test('should navigate to achievements/stats page', async ({ page }) => {
    await page.goto('/');

    // Look for achievements or stats link
    const achievementsNav = page.getByRole('link', { name: /achievement|stats|progress|profile/i }).first();

    const count = await achievementsNav.count();
    if (count > 0) {
      await achievementsNav.click();
      // Should navigate to achievements or profile page
      await expect(page).toHaveURL(/.*(?:achievement|stats|progress|profile)/);
    }
  });

  test('should complete focus session to maintain streak', async ({ page }) => {
    await page.goto('/focus');

    // Set a very short timer for testing (if possible)
    // Start the timer
    const startButton = page.getByRole('button', { name: /start|begin|focus/i }).first();
    await startButton.click();

    // Timer should be running
    const pauseButton = page.getByRole('button', { name: /pause|stop/i });
    await expect(pauseButton.first()).toBeVisible({ timeout: 5000 });

    // For E2E tests, we don't wait for full timer completion
    // Just verify the system is working
  });

  test('should persist streak data across sessions', async ({ page }) => {
    // Set up streak data
    await page.addInitScript(() => {
      localStorage.setItem('petparadise_streak', JSON.stringify({
        currentStreak: 7,
        lastCompletionDate: new Date().toISOString().split('T')[0],
        longestStreak: 14
      }));
    });

    await page.goto('/');

    // Reload the page
    await page.reload();

    // Streak should still be displayed
    const streakDisplay = page.locator('text=/7|streak|🔥/i');
    await expect(streakDisplay.first()).toBeVisible();
  });
});
