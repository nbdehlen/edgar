import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppProviders } from '@/AppProviders';
import { routes } from '@/routes/routes';

function renderRoute(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
  return router;
}

describe('component showcase', () => {
  it('redirects the home page and lets users submit the preview form', async () => {
    const user = userEvent.setup();
    const router = renderRoute('/');
    expect(await screen.findByRole('heading', { name: 'A little room to explore.' })).toBeVisible();
    expect(router.state.location.pathname).toBe('/components');
    await user.type(screen.getByLabelText('Display name'), 'Alex');
    await user.type(screen.getByLabelText('Email'), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: 'Save preview' }));
    expect(screen.getByText('Preview saved for Alex.')).toBeVisible();
    expect(screen.getByLabelText('Workspace')).toBeDisabled();
  });

  it('offers a route back from unknown URLs', async () => {
    const user = userEvent.setup();
    renderRoute('/missing');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'View components' }));
    expect(await screen.findByRole('heading', { name: 'A little room to explore.' })).toBeVisible();
  });
});
