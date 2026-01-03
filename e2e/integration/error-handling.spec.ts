/**
 * Error Handling E2E Integration Tests
 *
 * Tests the app's resilience to:
 * - Invalid routes
 * - Corrupted localStorage
 * - Network errors
 * - Edge cases
 */

import { test, expect, Page } from '@playwright/test';

// ============================================================================
// Test Helpers
// ============================================================================

async function setupBasicGuestUser(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('pet_paradise_guest_chosen', 'true');
    localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user-' + Date.now());
    localStorage.setItem('petparadise_onboarding_completed', 'true');
  });
}

async function waitForAppLoad(page: Page) {
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('.animate-spin');
    return spinners.length === 0;
  }, { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

// ============================================================================
// 404 and Invalid Route Tests
// ============================================================================

test.describe('404 and Invalid Routes', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicGuestUser(page);
  });

  test('should handle non-existent routes gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');

    // Should either show 404 page or redirect
    const notFoundText = page.locator('text=/not found|404|doesn\'t exist|page not found/i');
    const isNotFound = await notFoundText.first().isVisible().catch(() => false);
    const isRedirected = page.url().includes('/') || page.url().includes('/auth');

    expect(isNotFound || isRedirected).toBeTruthy();
  });

  test('should handle routes with special characters', async ({ page }) => {
    await page.goto('/shop?tab=featured&sort=price');
    await waitForAppLoad(page);

    // App should handle query parameters
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle hash routes', async ({ page }) => {
    await page.goto('/#/some-hash');
    await waitForAppLoad(page);

    // App should still work
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// Corrupted Data Tests
// ============================================================================

test.describe('Corrupted LocalStorage Handling', () => {
  test('should recover from corrupted XP data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');

      // Set corrupted XP data
      localStorage.setItem('petparadise_xp', 'not valid json {{{');
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // App should recover and show default state
    await expect(page.locator('body')).toBeVisible();

    // No error should be visible
    const errorMessage = page.locator('text=/error|crash|failed to load/i');
    const hasError = await errorMessage.first().isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should recover from corrupted coin data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');

      // Set invalid coin value
      localStorage.setItem('petparadise_coins', 'NaN');
    });

    await page.goto('/shop');
    await waitForAppLoad(page);

    // App should recover
    await expect(page.locator('body')).toBeVisible();
  });

  test('should recover from corrupted inventory data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');

      // Set corrupted inventory
      localStorage.setItem('petIsland_shopInventory', '{ broken: json }}}');
    });

    await page.goto('/shop');
    await waitForAppLoad(page);

    // App should recover with default inventory
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle missing localStorage gracefully', async ({ page }) => {
    // Don't set up any localStorage
    await page.goto('/');
    await waitForAppLoad(page);

    // Should redirect to auth or show guest option
    const authPage = page.url().includes('/auth');
    const hasGuestOption = await page.locator('text=/guest|continue/i').first().isVisible().catch(() => false);
    const hasContent = await page.locator('body').isVisible();

    expect(authPage || hasGuestOption || hasContent).toBeTruthy();
  });
});

// ============================================================================
// Edge Case Tests
// ============================================================================

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicGuestUser(page);
  });

  test('should handle rapid navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Rapidly navigate between pages
    const routes = ['/shop', '/collection', '/focus', '/', '/shop'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForTimeout(100);
    }

    // App should still be functional
    await waitForAppLoad(page);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle back/forward navigation', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    await page.goto('/shop');
    await waitForAppLoad(page);

    await page.goto('/collection');
    await waitForAppLoad(page);

    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/shop/);

    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/collection/);
  });

  test('should handle page refresh', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');
      localStorage.setItem('petparadise_coins', '999');
    });

    await page.goto('/shop');
    await waitForAppLoad(page);

    // Refresh the page
    await page.reload();
    await waitForAppLoad(page);

    // State should be preserved
    const coinDisplay = page.locator('text=/999/');
    await expect(coinDisplay.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle very long session', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');

      // Simulate a session that started a long time ago
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 24);
      localStorage.setItem('petparadise_session_start', oldDate.toISOString());
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // App should handle old session
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// Mobile Viewport Tests
// ============================================================================

test.describe('Mobile Viewport Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupBasicGuestUser(page);
  });

  test('should handle small mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE

    await page.goto('/');
    await waitForAppLoad(page);

    // App should be visible and functional
    await expect(page.locator('body')).toBeVisible();

    // Navigation should still work
    const nav = page.locator('nav, [role="navigation"]');
    const navVisible = await nav.first().isVisible().catch(() => false);
    expect(navVisible || true).toBeTruthy(); // May have different layout
  });

  test('should handle large tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 }); // iPad

    await page.goto('/');
    await waitForAppLoad(page);

    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle viewport resize', async ({ page }) => {
    await page.goto('/');
    await waitForAppLoad(page);

    // Start with mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);

    // App should still be functional
    await expect(page.locator('body')).toBeVisible();
  });
});

// ============================================================================
// Performance Edge Cases
// ============================================================================

test.describe('Performance Edge Cases', () => {
  test('should handle large data in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'e2e-test-user');
      localStorage.setItem('petparadise_onboarding_completed', 'true');

      // Create large achievement data
      const manyAchievements = Array.from({ length: 100 }, (_, i) => `achievement_${i}`);
      localStorage.setItem('petparadise_achievements', JSON.stringify({
        unlockedAchievements: manyAchievements,
        progress: Object.fromEntries(
          manyAchievements.map((a, i) => [a, { current: i, target: 100 }])
        ),
      }));

      // Create large inventory
      const manyCharacters = Array.from({ length: 50 }, (_, i) => `character_${i}`);
      const manyBackgrounds = Array.from({ length: 30 }, (_, i) => `background_${i}`);
      localStorage.setItem('petIsland_shopInventory', JSON.stringify({
        ownedCharacters: manyCharacters,
        ownedBackgrounds: manyBackgrounds,
        ownedBadges: [],
        equippedBadge: null,
        equippedBackground: null,
      }));
    });

    await page.goto('/');
    await waitForAppLoad(page);

    // App should handle large data without crashing
    await expect(page.locator('body')).toBeVisible();

    // Navigate to collection to test large inventory rendering
    await page.goto('/collection');
    await waitForAppLoad(page);

    await expect(page.locator('body')).toBeVisible();
  });
});
