import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { secConfig } from '../../config.js';
import { submissionsUrl } from './urls.js';
import { fakeClock } from '../../../test/helpers.js';

const userAgent = 'Edgar test@example.com';
const appleUrl = submissionsUrl('0000320193');
const spotifyUrl = submissionsUrl('0001639920');
const jpmorganUrl = submissionsUrl('0000019617');
let clientImportId = 0;
async function setup(t: TestContext, fetcher: typeof fetch) {
  const clock = fakeClock();
  const starts: number[] = [];
  const previousUserAgent = process.env.SEC_USER_AGENT;
  process.env.SEC_USER_AGENT = userAgent;
  t.after(() => {
    if (previousUserAgent === undefined) delete process.env.SEC_USER_AGENT;
    else process.env.SEC_USER_AGENT = previousUserAgent;
  });
  t.mock.method(Date, 'now', () => clock.now());
  t.mock.method(globalThis, 'fetch', async (...args: Parameters<typeof fetch>) => {
    starts.push(clock.now());
    return fetcher(...args);
  });
  // Advance simulated time instead of waiting for rate limits and retry backoff.
  t.mock.module('node:timers/promises', { namedExports: { setTimeout: (ms: number) => clock.sleep(ms) } });
  // Each test gets a fresh scheduler; requests within the test share it.
  const { fetchSecJson } = (await import(`./client.js?test=${clientImportId++}`)) as typeof import('./client.js');
  return { client: fetchSecJson, starts, clock };
}

test('spaces concurrent request starts without waiting for response completion', async (t) => {
  let release!: (response: Response) => void;
  const first = new Promise<Response>((resolve) => {
    release = resolve;
  });
  const { client, starts } = await setup(t, async (url, init) => {
    assert.equal(new Headers(init?.headers).get('user-agent'), userAgent);
    assert.ok(init?.signal);
    if (url === appleUrl) return first;
    return Response.json({ ok: true });
  });
  const pending = client(appleUrl);
  await Promise.all([client(spotifyUrl), client(jpmorganUrl)]);
  // Other companies can start while Apple's response is still pending.
  const interval = secConfig.requestIntervalMs;
  assert.deepEqual(starts, [0, interval, interval * 2]);
  release(Response.json({ ok: true }));
  await pending;
});

// Each entry is one SEC attempt; unexpected extra attempts fail the test.
function responseSequence(...responses: (Response | Error)[]): typeof fetch {
  return async () => {
    const response = responses.shift();
    assert.ok(response, 'Unexpected extra SEC attempt');
    if (response instanceof Error) throw response;
    return response;
  };
}

test('retries a network failure after the configured backoff', async (t) => {
  const { client, starts } = await setup(t, responseSequence(new TypeError('offline'), Response.json({ ok: true })));
  assert.deepEqual(await client(appleUrl), { ok: true });
  assert.deepEqual(starts, [0, secConfig.retryBackoffMs]);
});

for (const status of [429, 500, 503]) {
  test(`retries HTTP ${status} and honors Retry-After seconds`, async (t) => {
    const retryAfterSeconds = 2;
    const failure = new Response('', { status, headers: { 'Retry-After': String(retryAfterSeconds) } });
    const { client, starts } = await setup(t, responseSequence(failure, Response.json({ ok: true })));
    assert.deepEqual(await client(appleUrl), { ok: true });
    assert.deepEqual(starts, [0, retryAfterSeconds * 1000]);
  });
}

test('honors an HTTP date in Retry-After', async (t) => {
  const retryAt = Date.UTC(2026, 0, 1, 0, 0, 3);
  const failure = new Response('', { status: 429, headers: { 'Retry-After': new Date(retryAt).toUTCString() } });
  const { client, starts, clock } = await setup(t, responseSequence(failure, Response.json({ ok: true })));
  const requestedAt = Date.UTC(2026, 0, 1);
  clock.value = requestedAt;
  assert.deepEqual(await client(appleUrl), { ok: true });
  assert.deepEqual(starts, [requestedAt, retryAt]);
});

for (const status of [400, 403, 404]) {
  test(`does not retry HTTP ${status}`, async (t) => {
    const { client, starts } = await setup(t, responseSequence(new Response('', { status })));
    await assert.rejects(client(appleUrl), { status: 502 });
    assert.equal(starts.length, 1);
  });
}

for (const status of [429, 500]) {
  test(`stops after one retry when HTTP ${status} persists`, async (t) => {
    const { client, starts } = await setup(t, responseSequence(new Response('', { status }), new Response('', { status })));
    await assert.rejects(client(appleUrl), { status: 502 });
    assert.equal(starts.length, 2);
  });
}

test('does not retry malformed JSON', async (t) => {
  const { client, starts } = await setup(t, responseSequence(new Response('{broken')));
  await assert.rejects(client(appleUrl), { status: 502 });
  assert.equal(starts.length, 1);
});

test('configured timeout covers response bodies, retries once and maps to 504', async (t) => {
  let controller: AbortController;
  t.mock.method(AbortSignal, 'timeout', (ms: number) => {
    assert.equal(ms, secConfig.timeoutMs);
    controller = new AbortController();
    return controller.signal;
  });
  const { client, starts } = await setup(
    t,
    async () =>
      new Response(
        new ReadableStream({
          pull(stream) {
            // Headers arrived, but reading the body outlasts the attempt timeout.
            controller.abort();
            stream.error(new DOMException('Timed out', 'TimeoutError'));
          }
        })
      )
  );
  await assert.rejects(client(appleUrl), { status: 504 });
  assert.equal(starts.length, 2);
});

test('retry attempts share spacing with other company requests', async (t) => {
  const { client, starts } = await setup(t, async () => new Response('', { status: 503 }));
  await Promise.allSettled([client(appleUrl), client(spotifyUrl)]);
  assert.equal(starts.length, 4);
  // Initial requests and retries all pass through the same scheduler.
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i]! - starts[i - 1]! >= secConfig.requestIntervalMs);
});
