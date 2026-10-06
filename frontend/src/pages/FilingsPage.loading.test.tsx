import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { AppProviders } from '@/AppProviders';
import { routes } from '@/routes/routes';

function response(ticker: string, page = 1, form = '10-K') {
  return new Response(
    JSON.stringify({
      company: { ticker, cik: '0000320193', name: ticker },
      filings: [{ accessionNumber: `${ticker}-${page}`, form, filingDate: '2026-01-15', reportDate: null, documentUrl: null }],
      pagination: { page, pageSize: 25, total: 26 }
    })
  );
}

function pendingResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function renderPage() {
  const router = createMemoryRouter(routes, { initialEntries: ['/companies/AAPL/filings'] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return router;
}

async function advance(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('delays initial loading feedback and immediately shows completed results', async () => {
  vi.useFakeTimers();
  const request = pendingResponse();
  vi.stubGlobal(
    'fetch',
    vi.fn(() => request.promise)
  );
  renderPage();
  await advance(299);
  expect(screen.queryByText('Loading filings for AAPL…')).not.toBeInTheDocument();
  await advance(1);
  expect(screen.getByText('Loading filings for AAPL…')).toBeVisible();
  await act(async () => {
    request.resolve(response('AAPL'));
  });
  await advance(1);
  expect(screen.getByRole('table')).toBeVisible();
  expect(screen.queryByText('Loading filings for AAPL…')).not.toBeInTheDocument();
});

it.each([
  { search: '?page=2', page: 2, form: '10-K' },
  { search: '?form=8-K', page: 1, form: '8-K' }
])('retains results while loading $search and clears them when switching companies', async ({ search, page, form }) => {
  vi.useFakeTimers();
  const updated = pendingResponse();
  const microsoft = pendingResponse();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/MSFT/')) return microsoft.promise;
      if (url.includes(`page=${page}`) && (page === 2 || url.includes('form=8-K'))) return updated.promise;
      return Promise.resolve(response('AAPL'));
    })
  );
  const router = renderPage();
  await advance(10);
  expect(screen.getByRole('table')).toBeVisible();
  expect(screen.queryByText('Loading filings for AAPL…')).not.toBeInTheDocument();
  await act(() => router.navigate(`/companies/AAPL/filings${search}`));
  expect(screen.getByRole('cell', { name: '10-K' })).toBeVisible();
  await advance(300);
  expect(screen.getByText('Loading filings for AAPL…')).toBeVisible();
  expect(screen.getByRole('table')).toBeVisible();
  await act(async () => {
    updated.resolve(response('AAPL', page, form));
  });
  await advance(1);
  expect(screen.getByRole('cell', { name: form })).toBeVisible();
  expect(screen.getByText(`Page ${page} of 2 · 26 results`)).toBeVisible();
  expect(screen.queryByText('Loading filings for AAPL…')).not.toBeInTheDocument();

  // A previous company's filings must never appear under the new selection.
  await act(() => router.navigate('/companies/MSFT/filings'));
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'AAPL' })).not.toBeInTheDocument();
  await advance(300);
  expect(screen.getByText('Loading filings for MSFT…')).toBeVisible();
  await act(async () => {
    microsoft.resolve(response('MSFT'));
  });
  await advance(1);
  expect(screen.getByRole('heading', { name: 'MSFT' })).toBeVisible();
  expect(screen.queryByText('Loading filings for MSFT…')).not.toBeInTheDocument();
});
