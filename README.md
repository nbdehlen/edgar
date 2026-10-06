# EDGAR assignment

Browse SEC company filings by ticker and compare filing counts across companies.
The Express backend loads SEC data; the React frontend provides browsing and summary views.

- [Backend](backend/README.md): API contract, server configuration, and SEC caching.
- [Frontend](frontend/README.md): routes, code conventions, theming, and production hosting.

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

Configure the backend before starting it:

```sh
cp backend/.env.example backend/.env
```

Set `SEC_USER_AGENT` in `backend/.env` to your application name and contact email
(for example, `EdgarFilings developer@your-domain.com`). The backend requires this
identity to start and makes live requests to the SEC.

Start each server in a separate terminal from the repository root:

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

This runs repository lint and formatting checks, both apps' type checks, and unit
and backend integration tests. Production builds and Playwright browser tests
are separate; see each app's README for commands.
