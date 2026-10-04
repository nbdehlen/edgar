import type { TestContext } from 'node:test';
import { readFileSync } from 'node:fs';

export function submissions() {
  return JSON.parse(readFileSync(new URL('./fixtures/submissions.json', import.meta.url), 'utf8')) as {
    cik: string;
    name: string;
    filings: {
      recent: Record<'accessionNumber' | 'form' | 'filingDate' | 'reportDate' | 'primaryDocument', string[]>;
      files: { name: string; filingCount: number; filingFrom: string; filingTo: string }[];
    };
  };
}

export function tickers(): unknown {
  return JSON.parse(readFileSync(new URL('./fixtures/tickers.json', import.meta.url), 'utf8'));
}

export function fakeClock(initialTime = 0) {
  let currentTime = initialTime;
  return {
    now: () => currentTime,
    setTime(time: number) {
      currentTime = time;
    },
    advanceBy(durationMs: number) {
      currentTime += durationMs;
    }
  };
}

let loaderImportId = 0;

export async function mockCompanySecResponses(t: TestContext, fetchSecJson: (url: string) => Promise<unknown>, clock = fakeClock()) {
  t.mock.module('../src/shared/sec/client.js', { namedExports: { fetchSecJson } });
  t.mock.method(Date, 'now', () => clock.now());
  // A fresh module gives each test its own caches without a production reset API.
  const loader = await import(`../src/features/companies/loader.js?test=${loaderImportId++}`);
  return loader.loadCompany as typeof import('../src/features/companies/loader.js').loadCompany;
}
