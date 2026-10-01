# EDGAR assignment

See [backend/README.md](backend/README.md) for backend setup and commands.

```sh
npm ci
cd backend
npm ci
cp .env.example .env
npm run dev
```

The backend runs at http://localhost:3001. The frontend is not set up yet.

## Project tooling

ESLint and Prettier are installed and configured at the repository root. Run
these commands from root; they cover backend and future frontend source files,
including JSX and TSX.

```sh
npm run check
npm run lint:fix
npm run format
```

Prettier removes trailing commas. ESLint enforces a maximum of 160 lines per
source file, including blank lines and comments. Generated output and dependencies
are ignored. Downloaded fixtures in `test-data/` are excluded from formatting;
existing prompt export utilities in `codex/` are excluded from both tools.
