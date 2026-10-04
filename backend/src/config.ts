export const secConfig = {
  websiteBaseUrl: 'https://www.sec.gov',
  dataBaseUrl: 'https://data.sec.gov',
  // Cache lifetimes are measured from a successful load, in milliseconds.
  tickerTtlMs: 24 * 60 * 60 * 1000,
  submissionsTtlMs: 5 * 60 * 1000,
  requestIntervalMs: 200,
  timeoutMs: 10_000,
  retryBackoffMs: 1000
};

export function readUserAgent(value = process.env.SEC_USER_AGENT): string {
  const userAgent = value?.trim();
  if (!userAgent || /[\r\n]/.test(userAgent) || !/^\S.*\s+[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userAgent)) {
    throw new Error('SEC_USER_AGENT must contain an application name and contact email');
  }
  return userAgent;
}
