import assert from 'node:assert/strict';
import { test } from 'node:test';
import { startTestServer } from '../../../test/http.js';
import { HttpError } from '../../shared/errors/http-error.js';

test('filings summary endpoint', async (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: new Date('2026-10-05T12:00:00Z') });
  const requests: string[] = [];
  t.mock.module('../companies/loader.js', {
    namedExports: {
      loadCompany: async (ticker: string) => {
        requests.push(ticker);
        if (ticker === 'UNKNOWN') throw new HttpError(404, 'Ticker not found');
        if (ticker === 'JPM') throw new HttpError(502, 'SEC unavailable');
        if (ticker === 'SPOT') throw new HttpError(504, 'SEC request timed out');
        if (ticker === 'MSFT') {
          return { ticker, cik: '0000789019', name: 'Microsoft Corporation', filings: [], historicalFiles: [] };
        }
        assert.equal(ticker, 'AAPL');
        return {
          ticker,
          cik: '0000320193',
          name: 'Apple Inc.',
          historicalFiles: [],
          filings: [
            {
              accessionNumber: '0000320193-24-000001',
              form: '10-K',
              filingDate: '2024-11-01',
              reportDate: '2024-09-30',
              documentUrl: null
            },
            {
              accessionNumber: '0000320193-26-000001',
              form: '8-K',
              filingDate: '2026-10-05',
              reportDate: null,
              documentUrl: null
            }
          ]
        };
      }
    }
  });
  const { createApp } = await import('../../app.js');
  const get = await startTestServer(t, createApp());

  await t.test('returns one summary per normalized ticker in requested order', async () => {
    const response = await get('/filings/summary?tickers=%20msft,aapl,MSFT%20');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      period: { from: '2025-10-05', to: '2026-10-05' },
      companies: [
        {
          company: { ticker: 'MSFT', cik: '0000789019', name: 'Microsoft Corporation' },
          filingsByForm: {},
          latest10KDate: null
        },
        {
          company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
          filingsByForm: { '8-K': 1 },
          latest10KDate: '2024-11-01'
        }
      ]
    });
    assert.deepEqual(requests, ['MSFT', 'AAPL']);
  });

  await t.test('rejects invalid input before loading any companies', async () => {
    const requestsBefore = requests.length;
    for (const query of ['', '?tickers=', '?tickers=AAPL,', '?tickers=AAPL&tickers=MSFT']) {
      const response = await get(`/filings/summary${query}`);
      assert.equal(response.status, 400);
      assert.equal(typeof (await response.json()).error.message, 'string');
    }
    assert.equal(requests.length, requestsBefore);
  });

  for (const { ticker, status, message } of [
    { ticker: 'UNKNOWN', status: 404, message: 'Ticker not found' },
    { ticker: 'JPM', status: 502, message: 'SEC unavailable' },
    { ticker: 'SPOT', status: 504, message: 'SEC request timed out' }
  ]) {
    await t.test(`fails the whole batch when ${ticker} cannot load`, async () => {
      const response = await get(`/filings/summary?tickers=AAPL,${ticker}`);
      assert.equal(response.status, status);
      // A successfully loaded company must not leak into a partial-success response.
      assert.deepEqual(await response.json(), { error: { message } });
    });
  }
});
