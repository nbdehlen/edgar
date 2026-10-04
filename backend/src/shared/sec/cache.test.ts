import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ResourceCache } from './cache.js';

const cacheLifetimeMs = 100;
const loadOriginalApple = async () => 'Original Apple';
const loadUpdatedApple = async () => 'Updated Apple';

test('concurrent requests for the same company share one load', async (t) => {
  const cache = new ResourceCache<string>(cacheLifetimeMs);
  const load = t.mock.fn(loadOriginalApple);
  const names = await Promise.all([cache.get('AAPL', load), cache.get('AAPL', load)]);
  assert.deepEqual(names, ['Original Apple', 'Original Apple']);
  // Both callers receive the result of a single load.
  assert.equal(load.mock.callCount(), 1);
});

test('reuses a cached company until its expiry time', async (t) => {
  const loadedAt = Date.UTC(2026, 0, 1);
  const justBeforeExpiry = loadedAt + cacheLifetimeMs - 1;
  const expiryTime = loadedAt + cacheLifetimeMs;
  const now = t.mock.method(Date, 'now', () => loadedAt);
  const cache = new ResourceCache<string>(cacheLifetimeMs);
  await cache.get('AAPL', loadOriginalApple);
  const refresh = t.mock.fn(loadUpdatedApple);

  now.mock.mockImplementation(() => justBeforeExpiry);
  assert.equal(await cache.get('AAPL', refresh), 'Original Apple');
  assert.equal(refresh.mock.callCount(), 0);

  now.mock.mockImplementation(() => expiryTime);
  // An entry expires at the TTL boundary, not one millisecond later.
  assert.equal(await cache.get('AAPL', refresh), 'Updated Apple');
  assert.equal(refresh.mock.callCount(), 1);
});

test('a failed refresh is shared and never returns expired company data', async (t) => {
  const loadedAt = Date.UTC(2026, 0, 1);
  const expiryTime = loadedAt + cacheLifetimeMs;
  const now = t.mock.method(Date, 'now', () => loadedAt);
  const cache = new ResourceCache<string>(cacheLifetimeMs);
  await cache.get('AAPL', loadOriginalApple);
  now.mock.mockImplementation(() => expiryTime);
  const failure = new Error('SEC unavailable');
  const fail = t.mock.fn(async () => {
    throw failure;
  });

  const results = await Promise.allSettled([cache.get('AAPL', fail), cache.get('AAPL', fail)]);
  // Neither caller receives the stale name when their shared refresh fails.
  assert.deepEqual(results, [
    { status: 'rejected', reason: failure },
    { status: 'rejected', reason: failure }
  ]);
  assert.equal(fail.mock.callCount(), 1);
});

test('a failed load does not prevent the next request from succeeding', async () => {
  const cache = new ResourceCache<string>(cacheLifetimeMs);
  const failure = new Error('SEC unavailable');
  await assert.rejects(
    cache.get('AAPL', async () => {
      throw failure;
    }),
    failure
  );
  // A rejected promise must not remain registered as an in-flight request.
  assert.equal(await cache.get('AAPL', loadUpdatedApple), 'Updated Apple');
});
