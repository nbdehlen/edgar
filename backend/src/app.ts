import express from 'express';
import { healthRouter } from './features/health/routes.js';
import { errorHandler, notFoundHandler } from './shared/errors/middleware.js';

export const app = express();

app.disable('x-powered-by');
app.use(express.json());

app.use('/health', healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
