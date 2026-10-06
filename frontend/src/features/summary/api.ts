import type { FilingsResponse } from '../filings/api';

export class SummaryError extends Error {
  constructor(public status: number) {
    super(`Summary request failed (${status})`);
  }
}

export interface CompanySummary {
  company: FilingsResponse['company'];
  filingsByForm: Record<string, number>;
  latest10KDate: string | null;
}

export interface SummaryResponse {
  period: { from: string; to: string };
  companies: CompanySummary[];
}

export async function fetchSummary(tickers: string[], signal: AbortSignal): Promise<SummaryResponse> {
  const params = new URLSearchParams({ tickers: tickers.join(',') });
  const response = await fetch(`/api/filings/summary?${params}`, { signal });
  if (!response.ok) throw new SummaryError(response.status);
  return response.json();
}
