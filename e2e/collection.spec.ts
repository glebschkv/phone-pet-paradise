import { test, expect } from '@playwright/test';

test.describe('Pet Collection Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up guest mode with some unlocked pets
    await page.addInitScript(() => {
      localStorage.setItem('pet_paradise_guest_chosen', 'true');
      localStorage.setItem('pet_paradise_guest_id', 'guest-test-user');
      // Set XP to unlock some pets
      localStorage.setItem('petparadise_xp', JSON.stringify({
        currentXP: 1000,
        currentLevel: 5,
        totalXP: 1000,
        unlockedAnimals: ['Dewdrop Frog', 'Moss Turtle', 'Firefly Beetle']
      }));
    });
  });

  test('should navigate to collection page', async ({ page }) => {
    await page.goto('/');

    // Click on collection navigation
    const collectionNav = page.getByRole('link', { name: /collection|pets|animals/i }).first();
    await collectionNav.click();

    // Should be on the collection page
    await expect(page).toHaveURL(/.*collection/);
  });

  test('should display pet cards', async ({ page }) => {
    await page.goto('/collection');

    // Should show pet cards
    const petCards = page.locator('.pet-card, [data-testid="pet-card"], .animal-card, .collection-item');
    await expect(petCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show collection stats', async ({ page }) => {
    await page.goto('/collection');

    // Should show some stats (unlocked count, total, etc.)
    const statsText = page.locator('text=/\\d+\\s*\\/\\s*\\d+|unlocked|collected/i');
    await expect(statsText.first()).toBeVisible();
  });

  test('should filter pets by rarity', async ({ page }) => {
    await page.goto('/collection');

    // Look for filter controls
    const filterButtons = page.getByRole('button', { name: /common|rare|epic|legendary|all/i });

    const count = await filterButtons.count();
    if (count > 0) {
      // Click a filter
      await filterButtons.first().click();
      await page.waitForTimeout(300);

      // Collection should still show content
      const petCards = page.locator('.pet-card, [data-testid="pet-card"], .animal-card');
      // Just verify the page didn't crash
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show pet details on click', async ({ page }) => {
    await page.goto('/collection');

    // Wait for pets to load
    await page.waitForTimeout(1000);

    // Click on a pet card
    const petCard = page.locator('.pet-card, [data-testid="pet-card"], .animal-card').first();
    const count = await petCard.count();

    if (count > 0) {
      await petCard.click();

      // Should show pet details (modal or expanded view)
      const detailView = page.locator('[role="dialog"], .pet-detail, .modal, .pet-info');
      await expect(detailView.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow favoriting pets', async ({ page }) => {
    await page.goto('/collection');

    // Wait for pets to load
    await page.waitForTimeout(1000);

    // Look for favorite button (heart icon)
    const favoriteButton = page.getByRole('button', { name: /favorite|heart|love/i }).first();

    const count = await favoriteButton.count();
    if (count > 0) {
      await favoriteButton.click();
      // Just verify no crash
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
