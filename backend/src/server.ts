import { createApp } from './app.js';
import { readUserAgent } from './config.js';

// Validate SEC configuration before accepting requests.
readUserAgent();
const app = createApp();

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

app.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`);
});
