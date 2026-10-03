# Frontend

React + Vite with TypeScript, React Router, TanStack Query, Tailwind CSS, and
shadcn/ui using Radix primitives. Requires Node.js 24+ and npm.

## Development

From the repository root:

```sh
npm ci
npm --prefix frontend ci
npm --prefix frontend run dev
```

Open http://localhost:5173. `/` redirects to the temporary `/components`
showcase, which demonstrates the shared layout, buttons, inputs, cards, and
light/dark themes. Form submissions are local previews.

## Structure and conventions

- `src/main.tsx` and `src/AppProviders.tsx`: startup, QueryClient, theme, and i18n setup.
- `src/i18n.ts` and `src/locales/`: English translations for lasting UI copy; add languages there as needed. Temporary showcase copy stays in its components.
- `src/routes/`: route definitions.
- `src/pages/`: route-level composition.
- `src/features/<feature>/`: feature-owned components, hooks, API, and utilities.
- `src/shared/`: reusable components, utilities, hooks, and API code.

Create subfolders when needed. Use camelCase for ordinary files and functions,
PascalCase for React components, and retain shadcn's generated kebab-case names.
The `@/` alias points to `src/`. Keep server state in TanStack Query; add API
functions alongside their owning feature or under `shared/api` when shared.

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
npm run check                         # root lint, formatting, types, and frontend unit tests
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

Production output is `frontend/dist/`. Configure the hosting server to serve
`index.html` for unknown application paths so direct route navigation works.
