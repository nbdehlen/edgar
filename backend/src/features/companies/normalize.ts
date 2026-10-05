import { filingDocumentUrl } from '../../shared/sec/urls.js';
import { date, malformed, normalizeCik, record, string } from '../../shared/sec/validation.js';
import type { Filing, HistoricalFile, Submissions } from './types.js';

export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

export function normalizeTickers(payload: unknown): Map<string, string> {
  const tickers = new Map<string, string>();
  for (const value of Object.values(record(payload))) {
    const entry = record(value);
    tickers.set(normalizeTicker(string(entry.ticker)), normalizeCik(entry.cik_str));
  }
  return tickers;
}

function documentUrl(cik: string, accession: string, value: unknown): string | null {
  const path = string(value, true);
  if (!path.trim()) return null;
  return filingDocumentUrl(cik, accession, path);
}

function column(value: unknown): unknown[] {
  if (!Array.isArray(value)) malformed();
  return value;
}

export function normalizeFilings(payload: unknown, cik: string): Filing[] {
  const filings = record(payload);
  const accessions = column(filings.accessionNumber);
  const forms = column(filings.form);
  const filingDates = column(filings.filingDate);
  const reportDates = column(filings.reportDate);
  const documents = column(filings.primaryDocument);
  const columns = [forms, filingDates, reportDates, documents];
  // Each array index represents one filing; unequal lengths would mix unrelated fields.
  if (columns.some((values) => values.length !== accessions.length)) malformed();
  return accessions.map((value, index) => {
    const accessionNumber = string(value);
    if (!/^\d{10}-\d{2}-\d{6}$/.test(accessionNumber)) malformed();
    const reportDate = string(reportDates[index], true);
    return {
      accessionNumber,
      form: string(forms[index]),
      filingDate: date(filingDates[index]),
      reportDate: reportDate.trim() ? date(reportDate) : null,
      documentUrl: documentUrl(cik, accessionNumber, documents[index])
    };
  });
}

function normalizeHistory(payload: unknown): HistoricalFile[] {
  if (!Array.isArray(payload)) malformed();
  return payload.map((value: unknown) => {
    const file = record(value);
    return {
      name: string(file.name),
      filingFrom: date(file.filingFrom),
      filingTo: date(file.filingTo)
    };
  });
}

export function normalizeSubmissions(payload: unknown, expectedCik: string): Submissions {
  const company = record(payload);
  const cik = normalizeCik(company.cik);
  if (cik !== expectedCik) malformed();
  const filings = record(company.filings);
  return {
    cik,
    name: string(company.name),
    filings: normalizeFilings(filings.recent, cik),
    historicalFiles: normalizeHistory(filings.files)
  };
}
