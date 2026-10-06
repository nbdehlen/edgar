import type { CompanySummary } from './api';

export const defaultForms = ['10-K', '10-Q', '8-K'];

export function parseSummaryTickers(value: string) {
  return [
    ...new Set(
      value
        .split(/[\s,]+/)
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean)
    )
  ];
}

export function totalFilings(summary: CompanySummary) {
  return Object.values(summary.filingsByForm).reduce((total, count) => total + count, 0);
}

export function otherForms(summary: CompanySummary, visibleForms: string[]) {
  return Object.entries(summary.filingsByForm)
    .filter(([form]) => !visibleForms.includes(form))
    .sort(([a], [b]) => a.localeCompare(b));
}

export function otherCount(summary: CompanySummary, visibleForms: string[]) {
  return otherForms(summary, visibleForms).reduce((total, [, count]) => total + count, 0);
}

export function filingsLink(ticker: string) {
  return `/companies/${encodeURIComponent(ticker)}/filings`;
}

export function sortSummaries(companies: CompanySummary[], key: string, direction: 'ascending' | 'descending', forms: string[]) {
  function value(summary: CompanySummary) {
    if (key === 'company') return summary.company.ticker;
    if (key === 'total') return totalFilings(summary);
    if (key === 'other') return otherCount(summary, forms);
    if (key === 'latest') return summary.latest10KDate ?? '';
    return summary.filingsByForm[key] ?? 0;
  }
  return [...companies].sort((a, b) => {
    // Missing dates stay last in both directions.
    if (key === 'latest') {
      if (!a.latest10KDate && b.latest10KDate) return 1;
      if (a.latest10KDate && !b.latest10KDate) return -1;
    }
    const first = value(a);
    const second = value(b);
    const comparison = typeof first === 'number' && typeof second === 'number' ? first - second : String(first).localeCompare(String(second));
    return direction === 'ascending' ? comparison : -comparison;
  });
}
