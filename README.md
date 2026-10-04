# EDGAR assignment

See [backend/README.md](backend/README.md) for backend details.
See [frontend/README.md](frontend/README.md) for frontend details.

## Development

Use Node.js 24, as specified in `.nvmrc`. With nvm installed:

```sh
nvm install
nvm use
```

Install dependencies:

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

In VS Code, open the repo root and choose **Debug backend**, **Debug frontend**,
or **Debug backend + frontend**. Matching **Run** tasks start the servers without
debugging. Use the **(LAN)** variants to access them from another device via your
computer's local IP address.

## Checks

```sh
npm run check
```
