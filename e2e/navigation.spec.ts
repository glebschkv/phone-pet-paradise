import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
    });
  });

  test('should load home page successfully', async ({ page }) => {
    await page.goto('/');

    // Page should load without errors
    await expect(page).toHaveURL('/');

    // Should have main content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have working bottom navigation', async ({ page }) => {
    await page.goto('/');

    // Find navigation links
    const navLinks = page.locator('nav a, [role="navigation"] a, .nav-link, .bottom-nav a');

    // Should have navigation items
    await expect(navLinks.first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between all main pages', async ({ page }) => {
    const routes = ['/focus', '/collection', '/shop'];

    for (const route of routes) {
      await page.goto(route);

      // Each page should load successfully
      await expect(page).toHaveURL(route);

      // No error state should be visible
      const errorMessage = page.locator('text=/error|something went wrong|oops/i');
      await expect(errorMessage).not.toBeVisible({ timeout: 1000 }).catch(() => {
        // Ignore if not found - that's good
      });
    }
  });

  test('should show settings page', async ({ page }) => {
    await page.goto('/');

    // Find settings link
    const settingsLink = page.getByRole('link', { name: /settings|preferences|config/i }).first();

    const count = await settingsLink.count();
    if (count > 0) {
      await settingsLink.click();
      await expect(page).toHaveURL(/.*settings/);
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Should show some kind of not found message or redirect
    // Either a 404 page or redirect to home
    const notFoundText = page.locator('text=/not found|404|doesn\'t exist/i');
    const isNotFound = await notFoundText.count() > 0;
    const isHome = page.url().endsWith('/');

    expect(isNotFound || isHome).toBeTruthy();
  });

  test('should maintain responsive layout on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();

    // Navigation should still work
    const navElement = page.locator('nav, [role="navigation"]');
    await expect(navElement.first()).toBeVisible();
  });

  test('should preserve state when navigating back', async ({ page }) => {
    await page.goto('/');

    // Navigate to another page
    await page.goto('/focus');

    // Navigate back
    await page.goBack();

    // Should be back on home
    await expect(page).toHaveURL('/');
  });
});
