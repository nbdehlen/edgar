import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '@/AppProviders';
import { routes } from '@/routes/routes';
import '@/i18n';

const summary = {
  period: { from: '2025-10-05', to: '2026-10-05' },
  companies: [
    { company: { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft' }, filingsByForm: { '10-K': 1, '8-K': 4 }, latest10KDate: '2026-07-30' },
    { company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple' }, filingsByForm: { '10-K': 1, '10-K/A': 2, '4': 12 }, latest10KDate: '2024-11-01' },
    { company: { ticker: 'SPOT', cik: '0001639920', name: 'Spotify' }, filingsByForm: {}, latest10KDate: null }
  ]
};

function renderPage(path = '/summary') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return router;
}

function mockResponse(status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(summary), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('summary page', () => {
  it('adds a batch on submission and immediately removes companies, with browser back restoring selection', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage();
    await user.type(screen.getByLabelText('Companies'), 'msft,aapl AAPL spot');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Companies')).toHaveValue('msft,aapl AAPL spot');
    expect(screen.queryByRole('button', { name: 'Remove MSFT' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add companies' }));
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/filings/summary?tickers=MSFT%2CAAPL%2CSPOT', expect.anything());
    expect(new URLSearchParams(router.state.location.search).get('tickers')).toBe('MSFT,AAPL,SPOT');
    await user.click(screen.getByRole('button', { name: 'Remove SPOT' }));
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenLastCalledWith('/api/filings/summary?tickers=MSFT%2CAAPL', expect.anything());
    expect(screen.getByLabelText('Companies')).toHaveValue('');
    await act(() => router.navigate(-1));
    expect(await screen.findByRole('button', { name: 'Remove SPOT' })).toBeVisible();
  });

  it('keeps added tickers in the input until Enter and returns to the empty state after removing all companies', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage('/summary?tickers=MSFT');
    await screen.findByRole('table');
    await user.type(screen.getByLabelText('Companies'), 'aapl,');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Companies')).toHaveValue('aapl,');
    expect(screen.queryByRole('button', { name: 'Remove AAPL' })).not.toBeInTheDocument();
    await user.keyboard('{Enter}');
    await screen.findByRole('button', { name: 'Remove AAPL' });
    expect(fetchMock).toHaveBeenLastCalledWith('/api/filings/summary?tickers=MSFT%2CAAPL', expect.anything());
    expect(screen.getByLabelText('Companies')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Remove AAPL' }));
    await user.click(screen.getByRole('button', { name: 'Remove MSFT' }));
    expect(screen.getByText('Compare companies side by side')).toBeVisible();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('');
  });

  it('rejects empty and oversized selections, including oversized bookmarked URLs', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage();
    await user.click(screen.getByRole('button', { name: 'Add companies' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter at least one ticker');
    const tickers = Array.from({ length: 26 }, (_, index) => `CO${index}`).join(',');
    await act(() => router.navigate(`/summary?tickers=${tickers}`));
    expect(screen.getByRole('alert')).toHaveTextContent('up to 25');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Remove CO25' }));
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('expands exact other forms and recalculates Other when visible columns change', async () => {
    mockResponse();
    const user = userEvent.setup();
    renderPage('/summary?tickers=MSFT,AAPL,SPOT');
    const other = await screen.findByRole('button', { name: 'Other filings for AAPL: 14' });
    await user.click(other);
    const breakdown = within(screen.getByRole('table', { name: 'Other filings · AAPL' }));
    expect(breakdown.getByRole('row', { name: '10-K/A 2' })).toBeVisible();
    expect(breakdown.getByRole('row', { name: '4 12' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Form columns' }));
    await user.selectOptions(screen.getByLabelText('Form column 1'), '10-K/A');
    // The amendment moves into its own column, while the exact 10-K joins Other.
    expect(screen.getByRole('button', { name: 'Other filings for AAPL: 13' })).toHaveAttribute('aria-expanded', 'true');
    expect(breakdown.queryByRole('row', { name: '10-K/A 2' })).not.toBeInTheDocument();
    expect(breakdown.getByRole('row', { name: '10-K 1' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Other filings for AAPL: 13' }));
    expect(screen.queryByRole('table', { name: 'Other filings · AAPL' })).not.toBeInTheDocument();
  });

  it('sorts numerical totals and dates, keeps missing dates last, and restores requested order', async () => {
    mockResponse();
    const user = userEvent.setup();
    renderPage('/summary?tickers=MSFT,AAPL,SPOT');
    const table = await screen.findByRole('table');
    const companyOrder = () =>
      within(table)
        .getAllByRole('link')
        .map((link) => link.textContent);
    expect(companyOrder()).toEqual(['MSFTMicrosoft', 'AAPLApple', 'SPOTSpotify']);
    await user.click(screen.getByRole('button', { name: 'Total filings' }));
    expect(companyOrder()).toEqual(['SPOTSpotify', 'MSFTMicrosoft', 'AAPLApple']);
    await user.click(screen.getByRole('button', { name: 'Latest 10-K' }));
    expect(companyOrder()).toEqual(['AAPLApple', 'MSFTMicrosoft', 'SPOTSpotify']);
    await user.click(screen.getByRole('button', { name: 'Latest 10-K' }));
    expect(companyOrder()).toEqual(['MSFTMicrosoft', 'AAPLApple', 'SPOTSpotify']);
    expect(screen.getByText('None found')).toBeVisible();
    // An older 10-K is still displayed even when it predates the counting period.
    expect(screen.getByText('2024-11-01')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reset order' }));
    expect(companyOrder()).toEqual(['MSFTMicrosoft', 'AAPLApple', 'SPOTSpotify']);
  });

  it.each([404, 502])('shows a complete-request error for %s and allows retry', async (status) => {
    const fetchMock = mockResponse(status);
    const user = userEvent.setup();
    renderPage('/summary?tickers=AAPL,MSFT');
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load summary');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(summary)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});
