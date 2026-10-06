# Frontend

React + Vite with TypeScript, React Router, TanStack Query, Tailwind CSS, and
shadcn/ui using Radix primitives. See the [root README](../README.md) for setup
and running both apps. Commands below run from `frontend/`.

## Local API configuration

The Vite development server forwards `/api/*` to `http://127.0.0.1:3001`,
removing the `/api` prefix. To use a different backend address, copy
`.env.example` to `.env.local` in `frontend/` and set `API_PROXY_TARGET`.
Restart the development server after changing it. This setting is optional
and is only read by Vite; it is not exposed to browser code.

## Routes

- `/` redirects to `/filings`.
- `/filings`: company ticker entry.
- `/companies/:ticker/filings`: filings with filters and pagination in the URL,
  plus links to primary documents or complete submissions.
- `/summary?tickers=AAPL,MSFT`: compare up to 25 companies by form over the last
  12 months, with configurable columns and links to company filings. The latest
  10-K date covers all available history. See the [backend API contract](../backend/README.md#filings-summary-api)
  for counting and error semantics.
- `/components`: shared UI and theme showcase, available only in the Vite dev server.

## Structure and conventions

- `src/main.tsx` and `src/AppProviders.tsx`: startup, QueryClient, theme, and i18n setup.
- `src/i18n.ts` and `src/locales/`: English translations for lasting UI copy; add languages there as needed. Temporary showcase copy stays in its components.
- `src/routes/`: route definitions.
- `src/pages/`: route-level composition.
- `src/features/<feature>/`: feature-owned components, hooks, API, and utilities.
  `filings/` owns company filing browsing; `summary/` owns multi-company comparison.
- `src/shared/`: reusable components, utilities, hooks, and API code.

Create subfolders when needed. Use camelCase for ordinary files and functions,
PascalCase for React components, and retain shadcn's generated kebab-case names.
The `@/` alias points to `src/`. Keep API functions and types in each feature's
`api.ts`, and named TanStack Query hooks in `queries.ts`; pages compose these hooks.
Use `shared/api` for shared API code. Its `apiFetch` helper owns the `/api`
prefix and accepts endpoint paths starting with `/` plus standard fetch options.
Features own endpoint paths, query parameters, response types, and error handling.

## UI and theming

[shadcn preset b4YtS7GakV](https://ui.shadcn.com/create?preset=b4YtS7GakV)
uses Luma, Mist/Lime colors, Instrument Sans, and Merriweather headings.
Tokens live in `src/styles.css`; use semantic Tailwind colors. Fonts are bundled
locally. The theme starts with the system preference and persists manual choices.

Add shadcn components from `frontend/`:

```sh
npx shadcn@latest add dialog
```

`components.json` directs generated components to `src/shared/components` and
utilities to `src/shared/utils/cn.ts`. Compose reusable layouts rather than
repeating page styling.

## Checks

```sh
npm run typecheck
npm run build
npm test                             # Vitest + React Testing Library
npm run test:watch
npx playwright install chromium      # first browser setup
npm run test:e2e                      # desktop and mobile Chromium
```

Playwright starts Vite automatically and mocks API responses, so no running backend
is needed. Browser tests live in `e2e/`; unit tests are colocated with source.
See the [root checks](../README.md#checks) for repository-wide validation.
ESLint and Prettier use the repository root config; generated shadcn components
are exempt from the root line-count limit.

## Production hosting

`npm run build` writes `dist/`. Route same-origin `/api/*` requests to the backend,
removing the `/api` prefix. Serve `index.html` for unknown application paths so
direct route navigation works. `API_PROXY_TARGET` configures only the development
proxy, not production routing.
