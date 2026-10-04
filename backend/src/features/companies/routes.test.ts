import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpError } from '../../shared/errors/http-error.js';
import { submissionsUrl, tickerMappingUrl } from '../../shared/sec/urls.js';
import { submissions, tickers } from '../../../test/helpers.js';
import { startTestServer } from '../../../test/http.js';

test('company filings endpoint', async (t) => {
  const secRequests: string[] = [];
  // Exercise the real router, loader and cache with fixed SEC responses for each company.
  t.mock.module('../../shared/sec/client.js', {
    namedExports: {
      fetchSecJson: async (url: string) => {
        secRequests.push(url);
        if (url === tickerMappingUrl()) return tickers();
        if (url === submissionsUrl('0000320193')) return submissions();
        if (url === submissionsUrl('0000019617')) throw new HttpError(502, 'SEC unavailable');
        if (url === submissionsUrl('0001639920')) throw new HttpError(504, 'SEC request timed out');
        throw new Error(`Unexpected SEC request: ${url}`);
      }
    }
  });
  const { createApp } = await import('../../app.js');
  const get = await startTestServer(t, createApp());

  await t.test('returns company details, paginated filings and history coverage', async () => {
    const response = await get('/companies/%20aapl%20/filings?pageSize=1');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.company, { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' });
    assert.deepEqual(body.pagination, { page: 1, pageSize: 1, total: 3 });
    assert.equal(body.filings.length, 1);
    assert.deepEqual(body.coverage, { scope: 'recent', additionalHistoryAvailable: true });
  });

  await t.test('rejects invalid input before requesting SEC data', async () => {
    const requestsBeforeValidation = secRequests.length;
    for (const path of [
      '/companies/AAPL/filings?page=0',
      '/companies/AAPL/filings?sort=bad',
      '/companies/AAPL/filings?form=4&form=10-K',
      '/companies/%20/filings',
      '/companies/AAPL/filings?pageSize=101'
    ]) {
      assert.equal((await get(path)).status, 400, path);
    }
    // Invalid requests should never reach the SEC boundary.
    assert.equal(secRequests.length, requestsBeforeValidation);
  });

  await t.test('returns a JSON error for an unknown ticker', async () => {
    const response = await get('/companies/UNKNOWN/filings');
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: { message: 'Ticker not found' } });
  });

  await t.test('returns 502 when SEC data cannot be loaded', async () => {
    const response = await get('/companies/JPM/filings');
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { error: { message: 'SEC unavailable' } });
  });

  await t.test('returns 504 when SEC access times out', async () => {
    const response = await get('/companies/SPOT/filings');
    assert.equal(response.status, 504);
    assert.deepEqual(await response.json(), { error: { message: 'SEC request timed out' } });
  });
});
