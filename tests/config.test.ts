import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Playwright設定のデフォルト値が正しく設定される', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const { config } = await import('../src/config.js');
    
    expect(config.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    expect(config.navigationWaitMs).toBe(2000);
  });

  it('抽出設定のデフォルト値が正しく設定される', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    const { config } = await import('../src/config.js');
    
    expect(config.snippetContextChars).toBe(200);
  });

  it('環境変数から値を読み込める', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.USER_AGENT = 'Custom User Agent';
    process.env.NAV_WAIT_MS = '5000';
    process.env.SNIPPET_CONTEXT_CHARS = '500';
    
    const { config } = await import('../src/config.js');
    
    expect(config.userAgent).toBe('Custom User Agent');
    expect(config.navigationWaitMs).toBe(5000);
    expect(config.snippetContextChars).toBe(500);
  });
});