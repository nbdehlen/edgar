import express from 'express';
import { companiesRouter } from './features/companies/routes.js';
import { healthRouter } from './features/health/routes.js';
import { filingsRouter } from './features/filings/routes.js';
import { errorHandler, notFoundHandler } from './shared/errors/middleware.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/health', healthRouter);
  app.use('/companies', companiesRouter);
  app.use('/filings', filingsRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
