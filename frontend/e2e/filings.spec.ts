import { expect, test } from '@playwright/test';

test('filings controls work on desktop and mobile with bookmarkable URLs', async ({ page }) => {
  await page.route('**/api/companies/*/filings?*', async (route) => {
    const url = new URL(route.request().url());
    const form = url.searchParams.get('form') || '10-K';
    const currentPage = Number(url.searchParams.get('page'));
    await route.fulfill({
      json: {
        company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
        filings: [{ accessionNumber: 'apple-filing', form, filingDate: '2026-01-15', reportDate: null, documentUrl: 'https://www.sec.gov/Archives/apple.htm' }],
        pagination: { page: currentPage, pageSize: 25, total: 26 }
      }
    });
  });
  await page.goto('/');
  await page.getByLabel('Company ticker').fill('aapl');
  await page.getByRole('button', { name: 'Show filings' }).click();
  await expect(page.getByRole('heading', { name: 'Apple Inc.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Page 2 of 2 · 26 results')).toBeVisible();
  await page.getByLabel('Form type', { exact: true }).selectOption('other');
  await page.getByLabel('Exact form type').fill('10-K/A');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('cell', { name: '10-K/A', exact: true })).toBeVisible();
  await expect(page.getByText('Page 1 of 2 · 26 results')).toBeVisible();
  await page.getByLabel('Filing date order').selectOption('asc');
  await expect(page).toHaveURL(/sort=asc/);
  await page.reload();
  await expect(page.getByLabel('Exact form type')).toHaveValue('10-K/A');
  await expect(page.getByLabel('Filing date order')).toHaveValue('asc');
  await expect(page.getByRole('link', { name: /View 10-K\/A filed/ })).toHaveAttribute('target', '_blank');
  // The table can scroll horizontally without making the entire mobile page overflow.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
