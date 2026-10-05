import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HttpError } from '../../shared/errors/http-error.js';
import { historicalSubmissionsUrl, submissionsUrl, tickerMappingUrl } from '../../shared/sec/urls.js';
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
        if (url === historicalSubmissionsUrl(submissions().filings.files[0]!.name)) {
          return {
            accessionNumber: ['0000320193-20-000001'],
            form: ['10-K'],
            filingDate: ['2020-01-01'],
            reportDate: ['2019-12-31'],
            primaryDocument: ['annual.htm']
          };
        }
        if (url === submissionsUrl('0000320193')) return submissions();
        if (url === submissionsUrl('0000019617')) throw new HttpError(502, 'SEC unavailable');
        if (url === submissionsUrl('0001639920')) throw new HttpError(504, 'SEC request timed out');
        throw new Error(`Unexpected SEC request: ${url}`);
      }
    }
  });
  const { createApp } = await import('../../app.js');
  const get = await startTestServer(t, createApp());

  await t.test('returns company details and paginated filings', async () => {
    const response = await get('/companies/%20aapl%20/filings?pageSize=1');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.company, { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' });
    assert.deepEqual(body.pagination, { page: 1, pageSize: 1, total: 4 });
    assert.equal(body.filings.length, 1);
  });

  await t.test('includes history when sorting, filtering and paging', async () => {
    const oldest = await (await get('/companies/AAPL/filings?sort=asc&pageSize=1')).json();
    assert.equal(oldest.filings[0].filingDate, '2020-01-01');
    const last = await (await get('/companies/AAPL/filings?page=4&pageSize=1')).json();
    assert.equal(last.filings[0].filingDate, '2020-01-01');
    const annual = await (await get('/companies/AAPL/filings?form=10-K')).json();
    assert.equal(annual.pagination.total, 1);
    assert.equal(annual.filings[0].form, '10-K');
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
