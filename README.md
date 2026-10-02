# EDGAR assignment

See [backend/README.md](backend/README.md) for backend setup and commands.

```sh
npm ci
cd backend
npm ci
npm run dev
```

The backend runs at http://localhost:3001.

## Project tooling

ESLint and Prettier are installed and configured at the repository root. Run
these commands from root; they cover backend and future frontend source files,
including JSX and TSX.

```sh
npm run check
npm run lint:fix
npm run format
```
