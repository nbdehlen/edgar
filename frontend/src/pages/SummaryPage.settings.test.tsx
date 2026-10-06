import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { AppProviders } from '@/AppProviders';
import { routes } from '@/routes/routes';
import '@/i18n';

afterEach(() => vi.unstubAllGlobals());

it('preserves table settings when companies are removed and added', async () => {
  const microsoft = { company: { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft' }, filingsByForm: { '10-K': 1 }, latest10KDate: null };
  const apple = { company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple' }, filingsByForm: { '10-K/A': 2 }, latest10KDate: null };
  const period = { from: '2025-10-05', to: '2026-10-05' };
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ period, companies: [microsoft, apple] })));
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  const router = createMemoryRouter(routes, { initialEntries: ['/summary?tickers=MSFT,AAPL'] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  await screen.findByRole('table');
  await user.click(screen.getByRole('button', { name: 'Form columns' }));
  await user.selectOptions(screen.getByLabelText('Form column 1'), '10-K/A');
  await user.click(screen.getByRole('button', { name: 'Total filings' }));
  await user.click(screen.getByRole('button', { name: 'Other filings for MSFT: 1' }));

  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ period, companies: [microsoft] })));
  await user.click(screen.getByRole('button', { name: 'Remove AAPL' }));
  await waitFor(() => expect(screen.queryByRole('link', { name: /AAPL/ })).not.toBeInTheDocument());

  // A selected form remains available even after its only reporting company is removed.
  expect(screen.getByLabelText('Form column 1')).toHaveValue('10-K/A');
  expect(within(screen.getByLabelText('Form column 1')).getByRole('option', { name: '10-K/A' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Total filings' })).toHaveAttribute('aria-sort', 'ascending');
  expect(screen.getByRole('button', { name: 'Other filings for MSFT: 1' })).toHaveAttribute('aria-expanded', 'true');

  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ period, companies: [apple, microsoft] })));
  await user.type(screen.getByLabelText('Companies'), 'AAPL');
  await user.click(screen.getByRole('button', { name: 'Add companies' }));
  await screen.findByRole('link', { name: /AAPL/ });

  // The new response follows the retained sort, rather than its incoming company order.
  expect(screen.getAllByRole('link', { name: /Microsoft|Apple/ }).map((link) => link.textContent)).toEqual(['MSFTMicrosoft', 'AAPLApple']);
  expect(screen.getByLabelText('Form column 1')).toHaveValue('10-K/A');
  expect(screen.getByRole('button', { name: 'Other filings for MSFT: 1' })).toHaveAttribute('aria-expanded', 'true');
});
