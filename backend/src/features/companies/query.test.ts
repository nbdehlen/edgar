import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSubmissions } from './normalize.js';
import { parseQuery, queryFilings } from './query.js';
import { submissions } from '../../../test/helpers.js';

test('query defaults and strict input validation', () => {
  assert.deepEqual(parseQuery({}), { sort: 'desc', page: 1, pageSize: 25, form: undefined });
  assert.equal(parseQuery({ pageSize: '100', form: '10-K/A' }).pageSize, 100);
  for (const query of [
    { sort: 'ASC' },
    { sort: ['asc'] },
    { form: '' },
    { form: ['4'] },
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: '1e2' },
    { page: '9007199254740992' },
    { page: {} },
    { pageSize: '101' },
    { pageSize: '' },
    { pageSize: '0' }
  ])
    assert.throws(() => parseQuery(query), /Invalid/);
});

test('filters then sorts then paginates; ties ascend in both directions without mutating source', () => {
  const input = submissions();
  input.filings.recent.filingDate[0] = '2026-09-28';
  input.filings.recent.form[0] = '10-K';
  const company = { ticker: 'AAPL', ...normalizeSubmissions(input, input.cik) };
  const original = structuredClone(company);
  const desc = queryFilings(company, parseQuery({ pageSize: '2' }));
  assert.deepEqual(
    desc.filings.map((f) => f.accessionNumber.slice(-6)),
    ['038026', '038027']
  );
  assert.equal(desc.pagination.total, 3);
  const asc = queryFilings(company, parseQuery({ sort: 'asc' }));
  assert.deepEqual(
    asc.filings.map((f) => f.accessionNumber.slice(-6)),
    ['038028', '038026', '038027']
  );
  const filtered = queryFilings(company, parseQuery({ form: '4', page: '2', pageSize: '1' }));
  assert.equal(filtered.pagination.total, 2);
  assert.equal(filtered.filings[0]?.accessionNumber.slice(-6), '038027');
  assert.deepEqual(queryFilings(company, parseQuery({ page: '99' })).filings, []);
  assert.equal(queryFilings(company, parseQuery({ form: '4/A' })).pagination.total, 0);
  assert.deepEqual(company, original);
});
