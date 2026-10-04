export interface Filing {
  accessionNumber: string;
  form: string;
  filingDate: string;
  reportDate: string | null;
  documentUrl: string | null;
}

export interface HistoricalFile {
  name: string;
  filingFrom: string;
  filingTo: string;
}

export interface Submissions {
  cik: string;
  name: string;
  filings: Filing[];
  historicalFiles: HistoricalFile[];
}

export interface FilingQuery {
  form?: string;
  sort: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
