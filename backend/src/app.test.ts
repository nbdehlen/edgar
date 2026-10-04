import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from './app.js';
import { startTestServer } from '../test/http.js';

test('health endpoint returns application status', async (t) => {
  const get = await startTestServer(t, createApp());
  const response = await get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('unknown routes return a JSON error', async (t) => {
  const get = await startTestServer(t, createApp());
  const response = await get('/missing');
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: { message: 'Route not found' } });
});
