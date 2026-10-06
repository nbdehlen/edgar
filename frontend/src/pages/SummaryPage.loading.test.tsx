import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import { AppProviders } from '@/AppProviders';
import { routes } from '@/routes/routes';

function response(tickers: string[]) {
  return new Response(
    JSON.stringify({
      period: { from: '2025-10-05', to: '2026-10-05' },
      companies: tickers.map((ticker) => ({
        company: { ticker, cik: '0000320193', name: ticker },
        filingsByForm: { '10-K': 1 },
        latest10KDate: '2026-01-01'
      }))
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
  const router = createMemoryRouter(routes, { initialEntries: ['/summary?tickers=AAPL'] });
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

it('shows fast and cached results without loading feedback', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn(async () => response(['AAPL']));
  vi.stubGlobal('fetch', fetchMock);
  const router = renderPage();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await advance(10);
  expect(screen.getByRole('table')).toBeVisible();
  await act(() => router.navigate('/summary'));
  await act(() => router.navigate('/summary?tickers=AAPL'));
  expect(screen.getByRole('table')).toBeVisible();
  await advance(300);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('delays feedback and replaces previous results as soon as the updated selection is ready', async () => {
  vi.useFakeTimers();
  const initial = pendingResponse();
  const updated = pendingResponse();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => (url.includes('MSFT') ? updated.promise : initial.promise))
  );
  const router = renderPage();
  await advance(299);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await advance(1);
  expect(screen.getByRole('status')).toHaveTextContent('Loading company histories…');
  await act(async () => {
    initial.resolve(response(['AAPL']));
  });
  await advance(1);
  expect(screen.getByRole('table')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  await act(() => router.navigate('/summary?tickers=AAPL,MSFT'));
  expect(screen.getByRole('table')).toBeVisible();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await advance(300);
  expect(screen.getByRole('status')).toBeVisible();
  expect(screen.getAllByRole('row')).toHaveLength(2);
  await act(async () => {
    updated.resolve(response(['AAPL', 'MSFT']));
  });
  await advance(1);
  // Results appear immediately, without a minimum loading-message duration.
  expect(screen.getAllByRole('row')).toHaveLength(3);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('clears previous results and loading feedback when an updated selection fails', async () => {
  vi.useFakeTimers();
  const updated = pendingResponse();
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => (url.includes('UNKNOWN') ? updated.promise : Promise.resolve(response(['AAPL']))))
  );
  const router = renderPage();
  await advance(10);
  await act(() => router.navigate('/summary?tickers=AAPL,UNKNOWN'));
  await advance(300);
  expect(screen.getByRole('table')).toBeVisible();
  await act(async () => {
    updated.resolve(new Response('{}', { status: 404 }));
  });
  await advance(1);
  expect(screen.getByRole('alert')).toHaveTextContent('Unable to load summary');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
