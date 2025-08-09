import { logger } from './logger.js';
import { sleep } from './utils.js';

/**
 * レート制限管理クラス
 */
export class RateLimiter {
  private requestTimes: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;
  
  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  /**
   * レート制限をチェックし、必要に応じて待機
   */
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // 古いリクエスト記録を削除
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.windowMs
    );
    
    // 制限に達している場合は待機
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 1000; // 1秒余裕を持たせる
      
      if (waitTime > 0) {
        logger.warn(`レート制限に達しました。${Math.ceil(waitTime / 1000)}秒待機します...`);
        await sleep(waitTime);
      }
      
      // 再度古いリクエストを削除
      this.requestTimes = this.requestTimes.filter(
        time => Date.now() - time < this.windowMs
      );
    }
    
    // 現在のリクエストを記録
    this.requestTimes.push(Date.now());
  }
  
  /**
   * 統計情報を取得
   */
  getStats(): { current: number; max: number; windowMs: number } {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.windowMs
    );
    
    return {
      current: this.requestTimes.length,
      max: this.maxRequests,
      windowMs: this.windowMs,
    };
  }
}

/**
 * API別のレート制限管理
 */
export class ApiRateLimitManager {
  private limiters: Map<string, RateLimiter> = new Map();
  
  /**
   * APIごとのレート制限を設定
   */
  setLimit(apiName: string, maxRequests: number, windowMs: number): void {
    this.limiters.set(apiName, new RateLimiter(maxRequests, windowMs));
  }
  
  /**
   * レート制限をチェック
   */
  async checkLimit(apiName: string): Promise<void> {
    const limiter = this.limiters.get(apiName);
    if (limiter) {
      await limiter.checkLimit();
    }
  }
  
  /**
   * デフォルトのレート制限を設定
   */
  setupDefaults(): void {
    // OpenRouter: 10リクエスト/分
    this.setLimit('openrouter', 10, 60000);
    
    // SerpApi: 100リクエスト/月（無料プラン）を日割り
    this.setLimit('serpapi', 3, 3600000); // 3リクエスト/時
    
    // Webスクレイピング: 5リクエスト/10秒（サーバー負荷軽減）
    this.setLimit('web', 5, 10000);
  }
  
  /**
   * すべてのAPI統計を取得
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [apiName, limiter] of this.limiters) {
      stats[apiName] = limiter.getStats();
    }
    
    return stats;
  }
}

// グローバルインスタンス
export const rateLimitManager = new ApiRateLimitManager();
rateLimitManager.setupDefaults();