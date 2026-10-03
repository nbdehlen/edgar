import { expect, test } from '@playwright/test';

test('showcase works on direct navigation, persists theme, and fits the viewport', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/components');
  await expect(page.getByRole('heading', { name: 'A little room to explore.' })).toBeVisible();
  await page.getByLabel('Display name').fill('Alex');
  await page.getByLabel('Email', { exact: true }).fill('alex@example.com');
  await page.getByRole('button', { name: 'Save preview' }).click();
  await expect(page.getByText('Preview saved for Alex.')).toBeVisible();
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
