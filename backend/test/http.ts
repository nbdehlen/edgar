import type { TestContext } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

export async function startTestServer(t: TestContext, app: Express) {
  const server = app.listen(0, '127.0.0.1');
  t.after(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
        server.closeAllConnections();
      })
  );
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return (path: string) => fetch(`${baseUrl}${path}`);
}
