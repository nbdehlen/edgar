import { Router } from 'express';
import { loadCompany } from '../companies/loader.js';
import { parseTickers, summarizeCompany, summaryPeriod } from './summary.js';

export const filingsRouter = Router();
filingsRouter.get('/summary', async (request, response) => {
  const tickers = parseTickers(request.query);
  const period = summaryPeriod(new Date());
  const companies = await Promise.all(tickers.map(loadCompany));
  response.json({ period, companies: companies.map((company) => summarizeCompany(company, period)) });
});
