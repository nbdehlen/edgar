import assert from 'node:assert/strict';
import { test } from 'node:test';
import { secConfig } from '../../config.js';
import { historicalSubmissionsUrl, submissionsUrl, tickerMappingUrl } from '../../shared/sec/urls.js';
import { fakeClock, mockCompanySecResponses, submissions, tickers } from '../../../test/helpers.js';

test('loader shares complete loads, prefers recent duplicates and retries failed history', async (t) => {
  const current = submissions();
  const historical = structuredClone(current.filings.recent);
  historical.form[0] = '10-K';
  let historyResponse: unknown = null;
  let historyRequests = 0;
  let submissionsRequests = 0;
  const load = await mockCompanySecResponses(t, async (url) => {
    if (url === tickerMappingUrl()) return tickers();
    if (url === submissionsUrl(current.cik)) {
      submissionsRequests++;
      return current;
    }
    assert.equal(url, historicalSubmissionsUrl(current.filings.files[0]!.name));
    historyRequests++;
    return historyResponse;
  });

  // Malformed history must fail the entire load rather than expose partial filings.
  await assert.rejects(load('AAPL'), { status: 502 });
  historyResponse = historical;
  const [first, second] = await Promise.all([load('AAPL'), load('AAPL')]);
  assert.deepEqual(first.filings, second.filings);
  assert.equal(first.filings.length, 3);
  assert.equal(first.filings[0]?.form, '4');
  await load('AAPL');
  assert.equal(historyRequests, 2);
  assert.equal(submissionsRequests, 2);
});

test('loader refreshes current and historical filings together after expiry', async (t) => {
  const clock = fakeClock();
  const current = submissions();
  let historical = {
    accessionNumber: ['0000320193-15-000001'],
    form: ['10-K'],
    filingDate: ['2015-01-01'],
    reportDate: ['2014-12-31'],
    primaryDocument: ['annual.htm']
  };
  let submissionsRequests = 0;
  let historyRequests = 0;
  const load = await mockCompanySecResponses(
    t,
    async (url) => {
      if (url === tickerMappingUrl()) return tickers();
      if (url === submissionsUrl(current.cik)) {
        submissionsRequests++;
        return current;
      }
      assert.equal(url, historicalSubmissionsUrl(current.filings.files[0]!.name));
      historyRequests++;
      return historical;
    },
    clock
  );

  const first = await load('AAPL');
  historical = { ...historical, primaryDocument: ['corrected.htm'] };
  clock.setTime(secConfig.submissionsTtlMs - 1);
  assert.deepEqual((await load('AAPL')).filings, first.filings);
  assert.equal(submissionsRequests, 1);
  assert.equal(historyRequests, 1);

  clock.setTime(secConfig.submissionsTtlMs);
  const refreshed = await load('AAPL');
  // Even a historical file with an unchanged name is fetched again on refresh.
  assert.match(refreshed.filings.at(-1)!.document.url, /corrected.htm$/);
  assert.equal(submissionsRequests, 2);
  assert.equal(historyRequests, 2);
});
