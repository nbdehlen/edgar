import { setTimeout as sleep } from 'node:timers/promises';
import { readUserAgent, secConfig } from '../../config.js';
import { HttpError } from '../errors/http-error.js';

class RequestScheduler {
  private queue: Promise<void> = Promise.resolve();
  private nextStart = 0;

  start<T>(request: () => Promise<T>): Promise<T> {
    const turn = this.queue.then(async () => {
      while (Date.now() < this.nextStart) {
        await sleep(this.nextStart - Date.now());
      }
      this.nextStart = Date.now() + secConfig.requestIntervalMs;
      // Wrapping the promise lets the next start proceed before this response finishes.
      return { response: request() };
    });
    this.queue = turn.then(
      () => undefined,
      () => undefined
    );
    return turn.then(({ response }) => response);
  }
}

// All SEC requests share request start spacing, including retry attempts.
const scheduler = new RequestScheduler();

class RetryableSecError extends HttpError {}

function retryDelay(value: string | null, now: number): number {
  if (!value) return secConfig.retryBackoffMs;
  // Retry-After can contain either a delay in seconds or an HTTP date.
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Math.max(secConfig.retryBackoffMs, Number.isFinite(delay) ? delay : 0);
}

async function attempt(url: string, userAgent: string) {
  const signal = AbortSignal.timeout(secConfig.timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent, Accept: 'application/json' },
      signal
    });
    if (!response.ok) {
      await response.body?.cancel();
      return { response, data: undefined };
    }
    // Consume the body within the attempt's timeout.
    const body = await response.text();
    try {
      return { response, data: JSON.parse(body) as unknown };
    } catch {
      throw new HttpError(502, 'Malformed SEC response');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (signal.aborted) throw new RetryableSecError(504, 'SEC request timed out');
    throw new RetryableSecError(502, 'SEC request failed');
  }
}

export async function fetchSecJson(url: string): Promise<unknown> {
  const userAgent = readUserAgent();
  for (let index = 0; index < 2; index += 1) {
    let result;
    try {
      result = await scheduler.start(() => attempt(url, userAgent));
    } catch (error) {
      if (index === 1 || !(error instanceof RetryableSecError)) throw error;
      await sleep(secConfig.retryBackoffMs);
      continue;
    }
    if (result.response.ok) return result.data;
    const { status, headers } = result.response;
    if (index === 1 || (status !== 429 && status < 500)) {
      throw new HttpError(502, 'SEC request failed');
    }
    await sleep(retryDelay(headers.get('retry-after'), Date.now()));
  }
  throw new HttpError(502, 'SEC request failed');
}
