import assert from 'node:assert/strict';
import { test } from 'node:test';
import { secConfig } from '../../config.js';
import { historicalSubmissionsUrl, submissionsUrl, tickerMappingUrl } from '../../shared/sec/urls.js';
import { fakeClock, mockCompanySecResponses, submissions, tickers } from '../../../test/helpers.js';

test('loader shares company data across tickers and uses the current company name', async (t) => {
  const calls: string[] = [];
  // Both tickers map to Alphabet. Its submissions name intentionally differs from the mapping title.
  const alphabetSubmissions = {
    cik: '0001652044',
    name: 'Alphabet current name',
    filings: {
      recent: { accessionNumber: [], form: [], filingDate: [], reportDate: [], primaryDocument: [] },
      files: []
    }
  };
  const fetchJson = async (url: string) => {
    calls.push(url);
    if (url === tickerMappingUrl()) return tickers();
    assert.equal(url, submissionsUrl(alphabetSubmissions.cik));
    return alphabetSubmissions;
  };
  const load = await mockCompanySecResponses(t, fetchJson);
  const [google, googleClassA] = await Promise.all([load(' goog '), load('GOOGL')]);
  assert.deepEqual(calls, [tickerMappingUrl(), submissionsUrl(alphabetSubmissions.cik)]);
  assert.equal(google.cik, googleClassA.cik);
  assert.equal(google.ticker, 'GOOG');
  assert.equal(googleClassA.ticker, 'GOOGL');
  assert.equal(google.name, alphabetSubmissions.name);
  await assert.rejects(load('MISSING'), { status: 404 });
});

test('loader refreshes submissions and historical references when submissions expire', async (t) => {
  const clock = fakeClock();
  let submissionsResponse = submissions();
  let submissionsRequests = 0;
  const load = await mockCompanySecResponses(
    t,
    async (url) => {
      if (url === tickerMappingUrl()) return tickers();
      if (url === historicalSubmissionsUrl(submissions().filings.files[0]!.name)) return submissions().filings.recent;
      assert.equal(url, submissionsUrl('0000320193'));
      submissionsRequests++;
      return submissionsResponse;
    },
    clock
  );

  const first = await load('AAPL');
  assert.ok(first.historicalFiles.length > 0);
  submissionsResponse = submissions();
  submissionsResponse.filings.files = [];

  const justBeforeSubmissionsExpire = secConfig.submissionsTtlMs - 1;
  clock.setTime(justBeforeSubmissionsExpire);
  assert.deepEqual((await load('AAPL')).historicalFiles, first.historicalFiles);
  assert.equal(submissionsRequests, 1);

  const submissionsExpiryTime = secConfig.submissionsTtlMs;
  clock.setTime(submissionsExpiryTime);
  assert.deepEqual((await load('AAPL')).historicalFiles, []);
  assert.equal(submissionsRequests, 2);
});

test('loader refreshes ticker mappings when they expire', async (t) => {
  const clock = fakeClock();
  let mappingRequests = 0;
  const load = await mockCompanySecResponses(
    t,
    async (url) => {
      if (url === tickerMappingUrl()) {
        mappingRequests++;
        return tickers();
      }
      if (url === historicalSubmissionsUrl(submissions().filings.files[0]!.name)) return submissions().filings.recent;
      assert.equal(url, submissionsUrl('0000320193'));
      return submissions();
    },
    clock
  );

  await load('AAPL');
  const justBeforeMappingsExpire = secConfig.tickerTtlMs - 1;
  clock.setTime(justBeforeMappingsExpire);
  await load('AAPL');
  assert.equal(mappingRequests, 1);

  const mappingsExpiryTime = secConfig.tickerTtlMs;
  clock.setTime(mappingsExpiryTime);
  await load('AAPL');
  assert.equal(mappingRequests, 2);
});

test('loader retries malformed ticker mappings on the next lookup', async (t) => {
  let mappingResponse: unknown = null;
  let mappingRequests = 0;
  const load = await mockCompanySecResponses(t, async (url) => {
    if (url === tickerMappingUrl()) {
      mappingRequests++;
      return mappingResponse;
    }
    if (url === historicalSubmissionsUrl(submissions().filings.files[0]!.name)) return submissions().filings.recent;
    assert.equal(url, submissionsUrl('0000320193'));
    return submissions();
  });

  await assert.rejects(load('AAPL'), { status: 502 });
  mappingResponse = tickers();
  assert.equal((await load('AAPL')).cik, '0000320193');
  assert.equal(mappingRequests, 2);
});

test('loader retries malformed submissions without reloading valid ticker mappings', async (t) => {
  let submissionsResponse: unknown = null;
  let mappingRequests = 0;
  let submissionsRequests = 0;
  const load = await mockCompanySecResponses(t, async (url) => {
    if (url === tickerMappingUrl()) {
      mappingRequests++;
      return tickers();
    }
    if (url === historicalSubmissionsUrl(submissions().filings.files[0]!.name)) return submissions().filings.recent;
    assert.equal(url, submissionsUrl('0000320193'));
    submissionsRequests++;
    return submissionsResponse;
  });

  await assert.rejects(load('AAPL'), { status: 502 });
  submissionsResponse = submissions();
  assert.equal((await load('AAPL')).cik, '0000320193');
  assert.equal(mappingRequests, 1);
  assert.equal(submissionsRequests, 2);
});
