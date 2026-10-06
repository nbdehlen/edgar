import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSubmissions, normalizeTicker, normalizeTickers } from './normalize.js';
import { normalizeCik } from '../../shared/sec/validation.js';
import { submissions, tickers } from '../../../test/helpers.js';

const cik = '0000320193';

test('ticker identity preserves punctuation and accepts long tickers and shared CIKs', () => {
  assert.equal(normalizeTicker(' brk.b '), 'BRK.B');
  assert.equal(normalizeTicker(' very-long.symbol '), 'VERY-LONG.SYMBOL');
  const mappings = normalizeTickers(tickers());
  assert.equal(mappings.get('AAPL'), cik);
  assert.equal(mappings.get('GOOG'), mappings.get('GOOGL'));
  assert.equal(normalizeCik(320193), cik);
  for (const invalid of [null, {}, 0, -1, 1.2, '12345678901', 'abc']) {
    assert.throws(() => normalizeCik(invalid), /Malformed/);
  }
});

test('normalizes aligned columns, blank dates and document paths; ignores unused fields', () => {
  const input = submissions();
  input.filings.recent.reportDate[0] = '  ';
  input.filings.recent.primaryDocument[1] = '';
  input.filings.recent.primaryDocument[2] = 'folder/my file#1.htm';
  input.filings.recent.form[2] = '10-K/A';
  Object.assign(input, { formerNames: null });
  Object.assign(input.filings.recent, { unused: [null] });
  const result = normalizeSubmissions(input, cik);
  assert.equal(result.name, 'Apple Inc.');
  assert.equal(result.filings[0]?.reportDate, null);
  assert.equal(result.filings[0]?.document.url, 'https://www.sec.gov/Archives/edgar/data/320193/000114036126038028/xslF345X06/form4.xml');
  assert.equal(result.filings[0]?.document.kind, 'primary-document');
  assert.deepEqual(result.filings[1]?.document, {
    url: `https://www.sec.gov/Archives/edgar/data/320193/${input.filings.recent.accessionNumber[1]}.txt`,
    kind: 'complete-submission'
  });
  assert.match(result.filings[2]!.document.url, /folder\/my%20file%231.htm$/);
  assert.equal(result.filings[2]?.form, '10-K/A');
  assert.deepEqual(result.historicalFiles[0], {
    name: input.filings.files[0]!.name,
    filingFrom: '1994-01-26',
    filingTo: '2015-08-23'
  });
});

test('rejects malformed consumed fields and mismatched column lengths', () => {
  const mutations = [
    (s: ReturnType<typeof submissions>) => {
      s.filings.recent.form.pop();
    },
    (s: ReturnType<typeof submissions>) => {
      s.filings.recent.filingDate[0] = '2026-02-30';
    },
    (s: ReturnType<typeof submissions>) => {
      s.filings.recent.reportDate[0] = 'invalid';
    },
    (s: ReturnType<typeof submissions>) => {
      s.filings.recent.accessionNumber[0] = 'invalid';
    },
    (s: ReturnType<typeof submissions>) => {
      s.name = '';
    },
    (s: ReturnType<typeof submissions>) => {
      s.cik = '123';
    },
    (s: ReturnType<typeof submissions>) => {
      s.filings.files[0]!.filingFrom = 'bad';
    }
  ];
  for (const mutate of mutations) {
    const input = submissions();
    mutate(input);
    assert.throws(() => normalizeSubmissions(input, cik), /Malformed/);
  }
  for (const value of [null, [], {}, { ticker: 'AAPL', cik_str: null }]) {
    assert.throws(() => normalizeSubmissions(value, cik), /Malformed/);
  }
  assert.throws(() => normalizeTickers({ 0: { ticker: '', cik_str: 12 } }), /Malformed/);
});

test('blank paths link to the original complete submission for historical filings', () => {
  for (const path of ['', '  \t']) {
    const input = submissions();
    input.filings.recent.accessionNumber[0] = '0000912057-00-023442';
    input.filings.recent.primaryDocument[0] = path;
    const result = normalizeSubmissions(input, cik);
    // Older filings use the root archive path, without an accession directory.
    assert.deepEqual(result.filings[0]?.document, {
      url: 'https://www.sec.gov/Archives/edgar/data/320193/0000912057-00-023442.txt',
      kind: 'complete-submission'
    });
  }
});

test('missing or non-string document paths remain malformed SEC data', () => {
  for (const path of [null, undefined, 123]) {
    const input = submissions();
    Object.assign(input.filings.recent.primaryDocument, { 0: path });
    assert.throws(() => normalizeSubmissions(input, cik), /Malformed/);
  }
});
