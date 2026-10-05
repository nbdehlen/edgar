import { HttpError } from '../../shared/errors/http-error.js';
import { normalizeTicker } from '../companies/normalize.js';
import type { Submissions } from '../companies/types.js';

export function parseTickers(query: Record<string, unknown>): string[] {
  if (typeof query.tickers !== 'string') throw new HttpError(400, 'Provide a comma-separated list of tickers');
  const tickers = [...new Set(query.tickers.split(',').map(normalizeTicker))];
  if (tickers.includes('') || tickers.length > 25) {
    throw new HttpError(400, 'Provide between 1 and 25 unique, nonblank tickers');
  }
  return tickers;
}

export function summaryPeriod(now: Date) {
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  // February 29 rolls into March in a non-leap year; clamp to February's last day.
  if (from.getUTCMonth() !== now.getUTCMonth()) from.setUTCDate(0);
  return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export function summarizeCompany(company: Submissions & { ticker: string }, period: ReturnType<typeof summaryPeriod>) {
  const counts = new Map<string, number>();
  let latest10KDate: string | null = null;
  for (const filing of company.filings) {
    if (filing.filingDate >= period.from && filing.filingDate <= period.to) {
      counts.set(filing.form, (counts.get(filing.form) ?? 0) + 1);
    }
    if (filing.form === '10-K' && (latest10KDate === null || filing.filingDate > latest10KDate)) {
      latest10KDate = filing.filingDate;
    }
  }
  return {
    company: { ticker: company.ticker, cik: company.cik, name: company.name },
    filingsByForm: Object.fromEntries(counts),
    latest10KDate
  };
}
