# Frontend

React + Vite with TypeScript, React Router, TanStack Query, Tailwind CSS, and
shadcn/ui using Radix primitives. See the [root README](../README.md) for setup
and running both apps.

## Routes

- `/` redirects to `/filings`.
- `/filings`: company ticker entry.
- `/companies/:ticker/filings`: filings with filters and pagination in the URL.
- `/summary?tickers=AAPL,MSFT`: compare up to 25 companies over the last 12 months.
  Enter comma- or space-separated tickers, then select Add companies or press Enter
  to add them and update the results. Removing a ticker updates the results immediately.
  Sort the table, choose up to five form columns, and expand Other for the remaining
  exact form counts in a read-only table. Company links open historical filings;
  the latest 10-K date also searches all available history. A company failure fails the whole selection.
- `/components`: UI and theme showcase.

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
Use `shared/api` for shared API code.

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
npm run check                         # repository lint, formatting, types, and unit tests
npm --prefix frontend run build      # production build
npm --prefix frontend test           # Vitest + React Testing Library
npm --prefix frontend run test:watch
cd frontend
npx playwright install chromium      # first browser setup
npm run test:e2e                      # desktop and mobile Chromium
```

Playwright starts Vite automatically. Browser tests live in `e2e/`; unit tests
are colocated with source. ESLint and Prettier use the repository root config.
Generated shadcn components are exempt from the root line-count limit.

Production output is `frontend/dist/`. After forwarding `/api/*`, serve
`index.html` for unknown application paths so direct route navigation works.
