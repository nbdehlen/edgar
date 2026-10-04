import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readUserAgent } from './config.js';

const userAgent = 'Edgar test@example.com';

test('startup requires an application identity and contact email', () => {
  assert.equal(readUserAgent(` ${userAgent} `), userAgent);
  for (const value of ['', 'Edgar', 'test@example.com', 'Edgar no-contact', 'Edgar\r\ntest@example.com']) {
    assert.throws(() => readUserAgent(value), /SEC_USER_AGENT/);
  }
});
