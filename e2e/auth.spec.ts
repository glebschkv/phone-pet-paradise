import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should show auth page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to auth page
    await expect(page).toHaveURL(/.*auth/);

    // Should display auth options
    await expect(page.getByText(/sign in/i).first()).toBeVisible();
  });

  test('should allow continuing as guest', async ({ page }) => {
    await page.goto('/auth');

    // Find and click the guest mode button
    const guestButton = page.getByRole('button', { name: /continue as guest|guest mode|play as guest/i });
    await guestButton.click();

    // Should redirect to home page
    await expect(page).toHaveURL('/');

    // Should show main app content
    await expect(page.locator('main, [role="main"], .app-container').first()).toBeVisible();
  });

  test('should persist guest session across page reloads', async ({ page }) => {
    await page.goto('/auth');

    // Continue as guest
    const guestButton = page.getByRole('button', { name: /continue as guest|guest mode|play as guest/i });
    await guestButton.click();

    await expect(page).toHaveURL('/');

    // Reload the page
    await page.reload();

    // Should still be on home page (not redirected to auth)
    await expect(page).toHaveURL('/');
  });
});
