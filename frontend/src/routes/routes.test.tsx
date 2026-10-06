import { afterEach, expect, it, vi } from 'vitest';
import { matchRoutes } from 'react-router';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it('uses the not-found route for the showcase outside development', async () => {
  vi.stubEnv('DEV', false);
  const { routes } = await import('./routes');

  // Direct navigation must not expose the showcase when the dev flag is off.
  expect(matchRoutes(routes, '/components')?.at(-1)?.route.path).toBe('*');
});
