# EDGAR assignment

See [backend/README.md](backend/README.md) for backend details.
See [frontend/README.md](frontend/README.md) for frontend details.

## Development

```sh
npm ci
npm --prefix backend ci
npm --prefix frontend ci
```

Start each server in a separate terminal:

```sh
npm --prefix backend run dev
npm --prefix frontend run dev
```

The backend runs at http://localhost:3001 and the frontend at http://localhost:5173.

## Checks

```sh
npm run check
```
