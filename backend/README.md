# Backend

Express + TypeScript API for SEC company filings and multi-company summaries.
See the [root README](../README.md#development) for installation, required
`SEC_USER_AGENT` setup, and running both apps. Commands below run from `backend/`.

`PORT` defaults to `3001`; `HOST` defaults to `127.0.0.1` (`0.0.0.0` for LAN access).
Run `npm run dev` for development, or `npm run build` followed by `npm start`
for compiled server code in `dist/`. Both startup commands load `.env` and reject
missing or invalid SEC identities.

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
  and a required `document: { url, kind }` object. Blank report dates become `null`.
  `document.kind` is `primary-document` when the SEC provides a document path,
  or `complete-submission` when that path is blank or whitespace. `document.url`
  links to the primary document or the original complete submission text (including
  exhibits), respectively. Document availability is controlled by the SEC.
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

## Filings summary API

```sh
curl 'http://localhost:3001/filings/summary?tickers=AAPL,MSFT'
```

`GET /filings/summary` requires one comma-separated `tickers` parameter with 1–25
unique, nonblank tickers; invalid input returns `400`. Tickers are trimmed,
uppercased, and deduplicated, preserving first-requested order and punctuation.

The response contains `period: { from, to }` and a `companies` array with:

- `company`: `{ ticker, cik, name }`.
- `filingsByForm`: counts by exact form type (`10-K/A` counts separately).
  Zero-count forms are omitted; no filings produces `{}`.
- `latest10KDate`: latest exact `10-K` filing date across all available history,
  or `null` if absent, independent of the counting period.

The shared counting period runs from one calendar year before today through today
in UTC, inclusive, using filing dates. February 29 clamps to February 28.
Loading, caching, and error responses follow the company filings API above;
any company failure fails the entire request.

## SEC access and caching

SEC origins, cache lifetimes, request spacing, timeouts, and retry delays are
configured in [src/config.ts](src/config.ts). Request spacing applies across the
process, including retries; timeouts include reading the response body.

Network failures, timeouts, `429`, and `5xx` responses are retried once. Other
`4xx` responses and malformed payloads are not retried.

Complete submissions, including all referenced history, are cached together by CIK.
Concurrent requests for the same CIK share the entire load. The cache lifetime starts
after all files have loaded successfully; expiry or a failed load requires fetching
current submissions and history again. Failed loads are not cached; expired data is not served after a failed
refresh. Caches and rate coordination are in memory and assume one backend process.

The in-memory cache has no capacity limit. Expired entries are removed on their next
access; untouched entries remain in memory until the process exits.

## Structure

- `src/server.ts` and `src/app.ts`: startup and Express application setup.
- `src/features/`: company loading and filings queries, summaries, and health routes.
- `src/shared/`: SEC client, caching, URL construction, validation, and HTTP errors.

## Checks

```sh
npm test
npm run typecheck
npm run build
```

Tests use checked-in SEC fixtures and mocks; no live SEC connection is required.
Tests live beside their source files, with shared helpers and fixtures in `test/`.
The test script enables Node's experimental module mocking. Type checks include
tests; the build compiles only server code.
