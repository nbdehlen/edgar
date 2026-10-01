import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ error: { message: 'Route not found' } });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next
) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    response.status(400).json({ error: { message: 'Invalid JSON body' } });
    return;
  }

  console.error(error);
  response.status(500).json({ error: { message: 'Internal server error' } });
};
