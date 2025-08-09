import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, ApiRateLimitManager } from '../src/rate_limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('制限内のリクエストは即座に処理', async () => {
    const limiter = new RateLimiter(3, 1000); // 1秒に3リクエスト
    
    // 3回連続で呼び出し
    await limiter.checkLimit();
    await limiter.checkLimit();
    await limiter.checkLimit();
    
    const stats = limiter.getStats();
    expect(stats.current).toBe(3);
    expect(stats.max).toBe(3);
  });


  it('古いリクエスト記録は削除される', async () => {
    const limiter = new RateLimiter(5, 1000);
    
    // 3回リクエスト
    await limiter.checkLimit();
    await limiter.checkLimit();
    await limiter.checkLimit();
    
    let stats = limiter.getStats();
    expect(stats.current).toBe(3);
    
    // 時間を進める
    vi.advanceTimersByTime(1500);
    
    // 新しいリクエスト
    await limiter.checkLimit();
    
    stats = limiter.getStats();
    expect(stats.current).toBe(1); // 古いリクエストは削除された
  });

  it('統計情報を正しく返す', () => {
    const limiter = new RateLimiter(10, 60000);
    const stats = limiter.getStats();
    
    expect(stats).toEqual({
      current: 0,
      max: 10,
      windowMs: 60000,
    });
  });
});

describe('ApiRateLimitManager', () => {
  let manager: ApiRateLimitManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = new ApiRateLimitManager();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('API別に制限を設定できる', async () => {
    manager.setLimit('api1', 5, 1000);
    manager.setLimit('api2', 10, 2000);
    
    // api1の制限チェック
    for (let i = 0; i < 5; i++) {
      await manager.checkLimit('api1');
    }
    
    // api2の制限チェック（api1とは独立）
    for (let i = 0; i < 10; i++) {
      await manager.checkLimit('api2');
    }
    
    const stats = manager.getAllStats();
    expect(stats['api1'].current).toBe(5);
    expect(stats['api2'].current).toBe(10);
  });

  it('設定されていないAPIは制限なし', async () => {
    // 未設定のAPIは制限なし
    for (let i = 0; i < 100; i++) {
      await manager.checkLimit('unknown_api');
    }
    
    // エラーなく処理される
    expect(true).toBe(true);
  });

  it('デフォルト設定が適用される', () => {
    manager.setupDefaults();
    const stats = manager.getAllStats();
    
    expect(stats['openrouter']).toBeDefined();
    expect(stats['openrouter'].max).toBe(10);
    expect(stats['openrouter'].windowMs).toBe(60000);
    
    expect(stats['serpapi']).toBeDefined();
    expect(stats['web']).toBeDefined();
  });

  it('統計情報を取得できる', () => {
    manager.setLimit('test_api', 5, 1000);
    const stats = manager.getAllStats();
    
    expect(stats['test_api']).toEqual({
      current: 0,
      max: 5,
      windowMs: 1000,
    });
  });

  it('異なるAPIの制限は独立して動作', async () => {
    manager.setLimit('fast_api', 10, 1000);
    manager.setLimit('slow_api', 1, 1000);
    
    // fast_apiは10回OK
    for (let i = 0; i < 10; i++) {
      await manager.checkLimit('fast_api');
    }
    
    // slow_apiは1回のみ
    await manager.checkLimit('slow_api');
    
    const stats = manager.getAllStats();
    expect(stats['fast_api'].current).toBe(10);
    expect(stats['slow_api'].current).toBe(1);
  });
});