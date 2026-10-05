import { fetchSecJson } from '../../shared/sec/client.js';
import { secConfig } from '../../config.js';
import { HttpError } from '../../shared/errors/http-error.js';
import { historicalSubmissionsUrl, submissionsUrl, tickerMappingUrl } from '../../shared/sec/urls.js';
import { ResourceCache } from '../../shared/sec/cache.js';
import { normalizeFilings, normalizeSubmissions, normalizeTicker, normalizeTickers } from './normalize.js';
import type { Submissions } from './types.js';

const tickers = new ResourceCache<Map<string, string>>(secConfig.tickerTtlMs);
const submissions = new ResourceCache<Submissions>(secConfig.submissionsTtlMs);

export async function loadCompany(input: string) {
  const ticker = normalizeTicker(input);
  const mappings = await tickers.get('tickers', async () => normalizeTickers(await fetchSecJson(tickerMappingUrl())));
  const cik = mappings.get(ticker);
  if (!cik) throw new HttpError(404, 'Ticker not found');
  // Multiple tickers can identify the same company, so share submissions by CIK.
  const company = await submissions.get(cik, () => loadSubmissions(cik));
  return { ticker, ...company };
}

async function loadSubmissions(cik: string): Promise<Submissions> {
  const company = normalizeSubmissions(await fetchSecJson(submissionsUrl(cik)), cik);
  const filings = new Map(company.filings.map((filing) => [filing.accessionNumber, filing]));
  for (const file of company.historicalFiles) {
    const historicalFilings = normalizeFilings(await fetchSecJson(historicalSubmissionsUrl(file.name)), cik);
    for (const filing of historicalFilings) {
      // Prefer current submissions when the SEC history overlaps.
      if (!filings.has(filing.accessionNumber)) filings.set(filing.accessionNumber, filing);
    }
  }
  return { ...company, filings: [...filings.values()] };
}
