import { secConfig } from '../../config.js';

export function tickerMappingUrl(): string {
  return new URL('/files/company_tickers.json', secConfig.websiteBaseUrl).href;
}

export function submissionsUrl(cik: string): string {
  return new URL(`/submissions/CIK${cik}.json`, secConfig.dataBaseUrl).href;
}

export function filingDocumentUrl(cik: string, accession: string, path: string): string {
  // Encode each segment separately to preserve SEC document subdirectories.
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  // Archive paths use unpadded CIKs and accession numbers without hyphens.
  return new URL(`/Archives/edgar/data/${Number(cik)}/${accession.replaceAll('-', '')}/${encodedPath}`, secConfig.websiteBaseUrl).href;
}
