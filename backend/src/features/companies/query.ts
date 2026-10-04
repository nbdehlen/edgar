import { HttpError } from '../../shared/errors/http-error.js';
import type { FilingQuery, Submissions } from './types.js';

function invalid(): never {
  throw new HttpError(400, 'Invalid filings query');
}

function positiveInteger(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) invalid();
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) invalid();
  return number;
}

export function parseQuery(query: Record<string, unknown>): FilingQuery {
  const { form, sort = 'desc' } = query;
  if (form !== undefined && (typeof form !== 'string' || !form.trim())) invalid();
  if (sort !== 'asc' && sort !== 'desc') invalid();
  const page = positiveInteger(query.page, 1);
  const pageSize = positiveInteger(query.pageSize, 25);
  if (pageSize > 100) invalid();
  return { form, sort, page, pageSize };
}

function compareStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function queryFilings(company: Submissions & { ticker: string }, query: FilingQuery) {
  // Work on a new array so sorting cannot change the cached company data.
  const matching = company.filings.filter((filing) => query.form === undefined || filing.form === query.form);
  matching.sort((left, right) => {
    const byDate = compareStrings(left.filingDate, right.filingDate);
    if (byDate !== 0) return query.sort === 'asc' ? byDate : -byDate;
    return compareStrings(left.accessionNumber, right.accessionNumber);
  });
  const start = (query.page - 1) * query.pageSize;
  // Coverage describes all loaded company history, regardless of the current filter.
  const additionalHistoryAvailable = company.historicalFiles.length > 0;
  return {
    company: { ticker: company.ticker, cik: company.cik, name: company.name },
    filings: matching.slice(start, start + query.pageSize),
    pagination: { page: query.page, pageSize: query.pageSize, total: matching.length },
    coverage: {
      scope: additionalHistoryAvailable ? 'recent' : 'complete',
      additionalHistoryAvailable
    }
  };
}
