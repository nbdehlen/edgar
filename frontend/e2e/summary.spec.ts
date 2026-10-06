import { expect, test } from '@playwright/test';

test('summary supports 25 companies, expansion, and horizontal scrolling', async ({ page }) => {
  await page.route('**/api/filings/summary?*', async (route) => {
    const tickers = new URL(route.request().url()).searchParams.get('tickers')!.split(',');
    await route.fulfill({
      json: {
        period: { from: '2025-10-05', to: '2026-10-05' },
        companies: tickers.map((ticker, index) => ({
          company: { ticker, cik: String(index).padStart(10, '0'), name: `Company ${ticker}` },
          filingsByForm: { '10-K': 1, '10-Q': 3, '8-K': 10, '10-K/A': 2, '4': index + 1 },
          latest10KDate: '2026-01-15'
        }))
      }
    });
  });
  await page.goto('/summary');
  const tickers = ['AAPL', ...Array.from({ length: 24 }, (_, index) => `CO${index}`)];
  await page.getByLabel('Companies', { exact: true }).fill(tickers.join(','));
  await page.getByRole('button', { name: 'Add companies', exact: true }).click();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(26);
  // Numeric labels and values share the same right edge, independent of their icons.
  const alignment = await page.getByRole('table').evaluate((table) => {
    const headers = table.querySelectorAll('th');
    const cells = table.querySelectorAll('tbody tr:first-child td');
    function textRight(element: Element) {
      const range = document.createRange();
      range.selectNodeContents(element.firstChild!);
      return range.getBoundingClientRect().right;
    }
    return [1, 2, 3, 4, 5].map((index) => {
      const header = headers[index].querySelector('button')!;
      const value = cells[index].querySelector('button') ?? cells[index];
      return Math.abs(textRight(header) - textRight(value));
    });
  });
  expect(alignment.every((difference) => difference <= 2)).toBe(true);
  await expect(page.getByText('Last 12 months · 5 Oct 2025 – 5 Oct 2026')).toBeVisible();
  await page.getByRole('button', { name: 'Other filings for AAPL: 3', exact: true }).click();
  const breakdown = page.getByRole('table', { name: 'Other filings · AAPL' });
  await expect(breakdown.getByRole('row', { name: '10-K/A 2' })).toBeVisible();
  await expect(breakdown.getByRole('row', { name: '4 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Other filings for AAPL: 3', exact: true }).click();
  await page.getByRole('button', { name: 'Form columns', exact: true }).click();
  await page.getByLabel('Form column 1').selectOption('10-K/A');
  await expect(page.getByRole('button', { name: 'Other filings for AAPL: 2', exact: true })).toBeVisible();
  // The company stays visible while the comparison table scrolls within the page.
  await page.getByRole('link', { name: 'AAPL Company AAPL', exact: true }).scrollIntoViewIfNeeded();
  const container = page.locator('[data-slot="table-container"]');
  await container.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await expect(page.getByRole('link', { name: 'AAPL Company AAPL', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove AAPL', exact: true })).toBeVisible();
  await expect(page.getByRole('table').getByRole('row')).toHaveCount(26);
});
