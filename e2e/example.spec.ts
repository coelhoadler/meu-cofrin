import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Meu Cofrin/i);
});

test('should allow user to login', async ({ page }) => {
  await page.goto('/');

  await page.locator('button').first().click();
  await page.getByRole('button', { name: 'Entrar com Google' }).click();
  // await page.pause();
});
