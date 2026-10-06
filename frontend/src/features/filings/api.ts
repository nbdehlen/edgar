export interface Filing {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string | null;
  document: {
    url: string;
    kind: 'primary-document' | 'complete-submission';
  };
}

export interface FilingsResponse {
  company: { ticker: string; cik: string; name: string };
  filings: Filing[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface FilingsFilters {
  form: string;
  sort: 'asc' | 'desc';
  page: number;
}

export class FilingsError extends Error {
  constructor(public status: number) {
    super(`Filings request failed (${status})`);
  }
}

export async function fetchFilings(ticker: string, filters: FilingsFilters, signal: AbortSignal): Promise<FilingsResponse> {
  const params = new URLSearchParams({ sort: filters.sort, page: String(filters.page), pageSize: '25' });
  if (filters.form) params.set('form', filters.form);
  const response = await fetch(`/api/companies/${encodeURIComponent(ticker)}/filings?${params}`, { signal });
  if (!response.ok) throw new FilingsError(response.status);
  return response.json();
}
