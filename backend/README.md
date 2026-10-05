# Backend

Use Node.js 24. Install dependencies with `npm ci` in this directory. Copy
`.env.example` to `.env` and set `SEC_USER_AGENT` to your application name and a
contact email, for example `EdgarFilings developer@your-domain.com`. Startup
rejects missing or invalid identities. `PORT` defaults to `3001`; `HOST` defaults
to `127.0.0.1` (`0.0.0.0` for LAN access).

Run `npm run dev`, or `npm run build` followed by `npm start`.

## Filings API

```sh
curl 'http://localhost:3001/companies/AAPL/filings?form=10-K&sort=desc&page=1&pageSize=25'
```

`GET /companies/:ticker/filings` resolves a trimmed, uppercased ticker using the
SEC ticker mapping. Punctuation is preserved. Company names come from current
submissions; CIKs are ten-digit strings.

Optional query parameters:

- `form`: exact form value, including amendment suffixes such as `10-K/A`.
- `sort`: `asc` or `desc` (default), by filing date. Date ties sort by accession
  number ascending in either direction.
- `page`: positive integer, default `1`.
- `pageSize`: integer from `1` to `100`, default `25`.

Invalid values return `400`. The response contains:

- `company`: `{ ticker, cik, name }`.
- `filings`: entries with `accessionNumber`, `form`, `filingDate`, `reportDate`,
  and `documentUrl`. Blank report dates and document paths become `null`.
- `pagination`: `{ page, pageSize, total }`. `total` counts matching filings across current and historical submissions. Filtering and sorting precede pagination; out-of-range pages are empty.

Data comes from the SEC's main submissions payload and all referenced historical
files. Filings are deduplicated by accession number, preferring current submissions.
Filtering, sorting, and pagination run after all files load successfully. See the
[SEC API documentation](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)
for the source data's history coverage.

Errors use `{ "error": { "message": "..." } }`: unresolved tickers return `404`,
failed or malformed SEC responses return `502`, and upstream timeouts return
`504`. A failure loading any referenced historical file fails the whole request.
`GET /health` returns `{ "status": "ok" }`.

## SEC access and caching

Configure SEC access through `secConfig` in [src/config.ts](src/config.ts):

- `websiteBaseUrl` and `dataBaseUrl`: origins for ticker mappings, filing documents,
  and submissions. URL construction lives in `src/shared/sec/urls.ts`.
- `tickerTtlMs` and `submissionsTtlMs`: cache lifetimes in milliseconds, measured
  from each successful load.
- `requestIntervalMs`: minimum spacing between SEC request starts, shared across
  the process and including retries.
- `timeoutMs`: timeout per attempt, including reading the response body.
- `retryBackoffMs`: minimum wait before retrying; longer `Retry-After` delays take
  precedence.

Network failures, timeouts, `429`, and `5xx` responses are retried once. Other
`4xx` responses and malformed payloads are not retried.

Complete submissions, including all referenced history, are cached together by CIK.
Concurrent requests for the same CIK share the entire load. The cache lifetime starts
after all files have loaded successfully; expiry or a failed load requires fetching
current submissions and history again. Failed loads are not cached; expired data is not served after a failed
refresh. Caches and rate coordination are in memory and assume one backend process.

The in-memory cache has no capacity limit. Expired entries are removed on their next
access; untouched entries remain in memory until the process exits.

Routes import the shared `loadCompany` function directly; its module owns the caches.
SEC configuration is validated at startup. The shared `fetchSecJson` function uses
one process-wide scheduler and calls the platform fetch and timer APIs directly.

## Checks

`npm test` runs deterministic Node tests with checked-in fixtures derived from
SEC samples; no live SEC connection is required. Tests live beside the source files
they cover, including endpoint integration tests beside their routes. Shared helpers
and fixtures live in `test/`. Loader and route tests mock the SEC module using Node’s
experimental module-mocking flag, enabled by the test script.

`npm run typecheck` checks source and tests. `npm run build` uses
`tsconfig.build.json` to compile only server code. Root `npm run check` includes
the backend tests alongside the repository checks.
