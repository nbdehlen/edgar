import { Router } from 'express';
import type { HealthResponse } from './types.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  const health: HealthResponse = { status: 'ok' };
  response.json(health);
});
