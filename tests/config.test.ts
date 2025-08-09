import { describe, it, expect, beforeEach } from 'vitest';

describe('Config', () => {
  beforeEach(() => {
    // 環境変数をリセット
    delete process.env.LLM_PROVIDER;
    delete process.env.OPENROUTER_API_KEY;
  });
  
  it('デフォルト設定が正しく読み込まれる', async () => {
    // dynamic importを使用して毎回新しくモジュールを読み込む
    const { config } = await import('../src/config.js');
    
    expect(config.llmProvider).toBe('openrouter');
    expect(config.maxConcurrentRequests).toBe(3);
    expect(config.requestTimeoutMs).toBe(30000);
    expect(config.retryCount).toBe(3);
    expect(config.logLevel).toBe('info');
  });
  
  it('環境変数から設定が読み込まれる', async () => {
    process.env.LLM_PROVIDER = 'ollama';
    process.env.MAX_CONCURRENT_REQUESTS = '5';
    process.env.LOG_LEVEL = 'debug';
    
    // キャッシュをクリアして再import
    const modulePath = '../src/config.js';
    delete require.cache[require.resolve(modulePath)];
    const { config } = await import(modulePath);
    
    expect(config.llmProvider).toBe('ollama');
    expect(config.maxConcurrentRequests).toBe(5);
    expect(config.logLevel).toBe('debug');
  });
});