import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/AppProviders';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { routes } from '@/routes/routes';

const apple = {
  company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
  filings: [
    { accessionNumber: 'apple-annual', form: '10-K', filingDate: '2026-01-15', reportDate: null, documentUrl: 'https://www.sec.gov/Archives/apple.htm' }
  ],
  pagination: { page: 1, pageSize: 25, total: 26 }
};

function renderPage(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return router;
}

function mockResponse(data = apple, status = 200) {
  const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify(data), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('filings page', () => {
  it('submits a normalized ticker without fetching while typing and links to SEC documents', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage();
    expect(await screen.findByRole('heading', { name: 'Company filings' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/filings');
    await user.type(screen.getByLabelText('Company ticker'), ' aapl ');
    expect(fetchMock).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Apple Inc.' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/companies/AAPL/filings');
    expect(screen.getByRole('link', { name: /View 10-K filed/ })).toHaveAttribute('href', apple.filings[0].documentUrl);
    expect(screen.getByText('—')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('fetches URL filters, resets pagination, and restores filters with browser back', async () => {
    const fetchMock = mockResponse({ ...apple, pagination: { page: 2, pageSize: 25, total: 26 } });
    const user = userEvent.setup();
    const router = renderPage('/companies/AAPL/filings?form=10-K&sort=asc&page=2');
    await screen.findByRole('heading', { name: 'Apple Inc.' });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/companies/AAPL/filings?sort=asc&page=2&pageSize=25&form=10-K',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(apple)));
    await user.selectOptions(screen.getByLabelText('Form type'), '8-K');
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/api/companies/AAPL/filings?sort=asc&page=1&pageSize=25&form=8-K', expect.anything()));
    await user.selectOptions(screen.getByLabelText('Filing date order'), 'desc');
    expect(new URLSearchParams(router.state.location.search).get('page')).toBe('1');
    await act(() => router.navigate(-1));
    expect(screen.getByLabelText('Filing date order')).toHaveValue('asc');
    await act(() => router.navigate(-1));
    expect(screen.getByLabelText('Form type')).toHaveValue('10-K');
  });

  it('applies exact amendment forms only on submission', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage('/companies/AAPL/filings?page=2');
    await screen.findByRole('heading', { name: 'Apple Inc.' });
    await user.selectOptions(screen.getByLabelText('Form type'), 'other');
    await user.type(screen.getByLabelText('Exact form type'), '10-K/A');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenLastCalledWith('/api/companies/AAPL/filings?sort=desc&page=1&pageSize=25&form=10-K%2FA', expect.anything())
    );
    expect(new URLSearchParams(router.state.location.search).get('form')).toBe('10-K/A');
  });

  it('paginates and resets the page when switching companies', async () => {
    const fetchMock = mockResponse();
    const user = userEvent.setup();
    const router = renderPage('/companies/AAPL/filings');
    await screen.findByRole('heading', { name: 'Apple Inc.' });
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ ...apple, pagination: { page: 2, pageSize: 25, total: 26 } })));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText('Page 2 of 2 · 26 results');
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ ...apple, company: { ticker: 'BRK-B', cik: '0001067983', name: 'Berkshire Hathaway' } }))
    );
    await user.clear(screen.getByLabelText('Company ticker'));
    await user.type(screen.getByLabelText('Company ticker'), 'brk-b{Enter}');
    await screen.findByRole('heading', { name: 'Berkshire Hathaway' });
    expect(router.state.location.pathname).toBe('/companies/BRK-B/filings');
    expect(new URLSearchParams(router.state.location.search).get('page')).toBe('1');
  });

  it('shows empty results with disabled pagination', async () => {
    mockResponse({ ...apple, filings: [], pagination: { page: 1, pageSize: 25, total: 0 } });
    renderPage('/companies/AAPL/filings');
    expect(await screen.findByText('No filings found')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('shows unknown tickers and allows a corrected submission', async () => {
    const fetchMock = mockResponse(apple, 404);
    const user = userEvent.setup();
    renderPage('/companies/UNKNOWN/filings');
    expect(await screen.findByRole('alert')).toHaveTextContent('Company not found');
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(apple)));
    await user.clear(screen.getByLabelText('Company ticker'));
    await user.type(screen.getByLabelText('Company ticker'), 'AAPL{Enter}');
    expect(await screen.findByRole('heading', { name: 'Apple Inc.' })).toBeVisible();
  });

  it('allows retrying a service failure', async () => {
    const fetchMock = mockResponse(apple, 504);
    const user = userEvent.setup();
    renderPage('/companies/AAPL/filings');
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load filings');
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(apple)));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Apple Inc.' })).toBeVisible();
  });
});
