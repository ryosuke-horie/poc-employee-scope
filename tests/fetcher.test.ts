process.env.OPENROUTER_API_KEY = 'dummy';
process.env.NAV_WAIT_MS = '0';
process.env.RETRY_COUNT = '0';
process.env.REQUEST_TIMEOUT_MS = '1000';

import { describe, it, expect, afterAll } from 'vitest';
import http from 'http';
import { fetcher } from '../src/fetcher.js';

async function startServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise(resolve => {
    const server = http.createServer(handler);
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr !== 'string') {
        resolve({
          url: `http://127.0.0.1:${addr.port}`,
          close: () =>
            new Promise<void>(resolveClose => server.close(() => resolveClose())),
        });
      }
    });
  });
}

describe('fetchPage', () => {
  afterAll(async () => {
    await fetcher.close();
  });

  it('returns success for 200 response', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><head><title>ok</title></head><body>Hello</body></html>');
    });

    try {
      const result = await fetcher.fetchPage(server.url);
      expect(result.success).toBe(true);
      expect(result.title).toBe('ok');
    } finally {
      await server.close();
    }
  }, 30000);

  it('returns error for 404 response', async () => {
    const server = await startServer((req, res) => {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('not found');
    });

    try {
      const result = await fetcher.fetchPage(server.url);
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTPエラー: 404');
    } finally {
      await server.close();
    }
  }, 30000);
});

