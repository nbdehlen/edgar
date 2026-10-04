import { Router } from 'express';
import { HttpError } from '../../shared/errors/http-error.js';
import { loadCompany } from './loader.js';
import { parseQuery, queryFilings } from './query.js';

export const companiesRouter = Router();
companiesRouter.get('/:ticker/filings', async (request, response) => {
  const query = parseQuery(request.query);
  const ticker = request.params.ticker;
  if (!ticker.trim()) throw new HttpError(400, 'Ticker must not be blank');
  const company = await loadCompany(ticker);
  response.json(queryFilings(company, query));
});
