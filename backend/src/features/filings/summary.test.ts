import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Filing } from '../companies/types.js';
import { parseTickers, summarizeCompany, summaryPeriod } from './summary.js';

test('normalizes and deduplicates tickers while preserving input order and punctuation', () => {
  assert.deepEqual(parseTickers({ tickers: ' msft, aapl,MSFT,brk-b ' }), ['MSFT', 'AAPL', 'BRK-B']);
  const tickers = Array.from({ length: 25 }, (_, index) => `COMPANY${index}`);
  assert.deepEqual(parseTickers({ tickers: tickers.join(',') }), tickers);
  for (const query of [
    {},
    { tickers: '' },
    { tickers: ' ' },
    { tickers: 'AAPL,' },
    { tickers: ',AAPL' },
    { tickers: 'AAPL, ,MSFT' },
    { tickers: ['AAPL', 'MSFT'] },
    { tickers: {} },
    { tickers: [...tickers, 'EXTRA'].join(',') }
  ]) {
    assert.throws(() => parseTickers(query), { status: 400 });
  }
});

test('uses UTC calendar dates and clamps leap day to February 28', () => {
  assert.deepEqual(summaryPeriod(new Date('2026-10-05T23:59:59Z')), { from: '2025-10-05', to: '2026-10-05' });
  assert.deepEqual(summaryPeriod(new Date('2024-02-29T12:00:00Z')), { from: '2023-02-28', to: '2024-02-29' });
  assert.deepEqual(summaryPeriod(new Date('2025-03-01T00:30:00+02:00')), { from: '2024-02-28', to: '2025-02-28' });
});

function companyWithFilings(entries: [string, string][]) {
  const filings: Filing[] = entries.map(([form, filingDate], index) => ({
    accessionNumber: `0000320193-26-${String(index).padStart(6, '0')}`,
    form,
    filingDate,
    reportDate: '2020-01-01',
    documentUrl: null
  }));
  return { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.', historicalFiles: [], filings };
}

test('counts exact forms within inclusive boundaries using filing dates, without changing source data', () => {
  const company = companyWithFilings([
    ['8-K', '2025-10-04'],
    ['8-K', '2025-10-05'],
    ['8-K', '2026-10-05'],
    ['8-K', '2026-10-06'],
    ['10-K/A', '2026-09-01'],
    ['10-K', '2026-01-01'],
    ['10-K', '2025-11-01']
  ]);
  const original = structuredClone(company);
  const summary = summarizeCompany(company, { from: '2025-10-05', to: '2026-10-05' });
  assert.deepEqual(summary.filingsByForm, { '8-K': 2, '10-K/A': 1, '10-K': 2 });
  // Neither the newer amendment nor array order determines the latest annual filing.
  assert.equal(summary.latest10KDate, '2026-01-01');
  assert.deepEqual(company, original);
});

test('finds the latest 10-K outside the counting window and returns null when absent', () => {
  const period = { from: '2025-10-05', to: '2026-10-05' };
  const summary = summarizeCompany(companyWithFilings([['10-K', '2024-01-01']]), period);
  assert.deepEqual(summary.filingsByForm, {});
  assert.equal(summary.latest10KDate, '2024-01-01');
  assert.equal(summarizeCompany(companyWithFilings([['10-K/A', '2026-01-01']]), period).latest10KDate, null);
  assert.deepEqual(summarizeCompany(companyWithFilings([]), period), {
    company: { ticker: 'AAPL', cik: '0000320193', name: 'Apple Inc.' },
    filingsByForm: {},
    latest10KDate: null
  });
});
