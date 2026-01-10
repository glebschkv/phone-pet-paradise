import { test, expect } from '@playwright/test';

test.describe('Shop Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode with some coins
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
      // Give user some coins for testing purchases
      localStorage.setItem('petparadise_coins', '1000');
      // Set XP state
      localStorage.setItem('petparadise_xp', JSON.stringify({
        currentXP: 500,
        currentLevel: 3,
        totalXP: 500
      }));
    });
  });

  test('should navigate to shop page', async ({ page }) => {
    await page.goto('/');

    // Click on shop navigation
    const shopNav = page.getByRole('link', { name: /shop|store/i }).first();
    await shopNav.click();

    // Should be on the shop page
    await expect(page).toHaveURL(/.*shop/);
  });

  test('should display shop tabs', async ({ page }) => {
    await page.goto('/shop');

    // Should show tab navigation (Featured, Pets, Power-ups, etc.)
    const tabs = page.getByRole('tab');
    await expect(tabs.first()).toBeVisible();
  });

  test('should display coin balance', async ({ page }) => {
    await page.goto('/shop');

    // Should show coin balance somewhere on the page
    const coinDisplay = page.locator('text=/\\d+\\s*(coins?|🪙|💰)/i');
    await expect(coinDisplay.first()).toBeVisible();
  });

  test('should switch between shop tabs', async ({ page }) => {
    await page.goto('/shop');

    // Get all tabs
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();

    // Click through each tab
    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      await tabs.nth(i).click();
      // Wait for content to load
      await page.waitForTimeout(300);
    }
  });

  test('should display purchasable items', async ({ page }) => {
    await page.goto('/shop');

    // Should show some items for purchase
    const _purchaseButtons = page.getByRole('button', { name: /buy|purchase|unlock|get/i });

    // Wait for items to load
    await page.waitForTimeout(500);

    // There should be at least some purchasable content
    const itemCards = page.locator('.shop-item, [data-testid="shop-item"], .pet-card, .item-card');
    await expect(itemCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show purchase confirmation dialog', async ({ page }) => {
    await page.goto('/shop');

    // Wait for items to load
    await page.waitForTimeout(1000);

    // Find a buy button
    const buyButton = page.getByRole('button', { name: /buy|purchase|unlock|get/i }).first();

    // If there's a buy button, click it
    const count = await buyButton.count();
    if (count > 0) {
      await buyButton.click();

      // Should show confirmation dialog
      const dialog = page.getByRole('dialog');
      await expect(dialog.first()).toBeVisible({ timeout: 3000 });
    }
  });
});
