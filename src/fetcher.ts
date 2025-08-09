import { chromium, Browser, Page } from 'playwright';
import { config } from './config.js';
import { logger } from './logger.js';
import { withRetry } from './utils.js';

export interface FetchResult {
  url: string;
  html: string;
  text: string;
  title: string;
  success: boolean;
  error?: string;
  statusCode?: number;
  fetchedAt?: string;
}

class PageFetcher {
  private browser: Browser | null = null;
  
  /**
   * ブラウザを初期化
   */
  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
      logger.info('ブラウザを起動しました');
    } catch (error) {
      logger.error('ブラウザ起動エラー', error);
      throw error;
    }
  }
  
  /**
   * ページを取得
   */
  async fetchPage(url: string): Promise<FetchResult> {
    if (!this.browser) {
      await this.initialize();
    }
    
    return withRetry(
      async () => await this.fetchPageInternal(url),
      config.retryCount,
      2000,
      1.5
    );
  }
  
  /**
   * ページ取得の内部実装
   */
  private async fetchPageInternal(url: string): Promise<FetchResult> {
    let page: Page | null = null;
    
    try {
      if (!this.browser) {
        throw new Error('ブラウザが初期化されていません');
      }
      
      // 新しいページを作成
      page = await this.browser.newPage();
      
      // ユーザーエージェントを設定
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'ja-JP,ja;q=0.9,en;q=0.8',
        'User-Agent': config.userAgent,
      });
      
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // タイムアウト設定
      page.setDefaultTimeout(config.requestTimeoutMs);
      page.setDefaultNavigationTimeout(config.requestTimeoutMs);
      
      logger.debug(`ページ取得開始: ${url}`);
      
      // ページに移動
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.requestTimeoutMs,
      });
      
      if (!response) {
        throw new Error('ページのレスポンスが取得できません');
      }
      
      // ステータスコードチェック
      const status = response.status();
      if (status >= 400) {
        throw new Error(`HTTPエラー: ${status}`);
      }
      
      // JavaScriptの実行を待つ
      await page.waitForTimeout(config.navigationWaitMs);
      
      // ページ情報を取得
      const title = await page.title();
      const html = await page.content();
      
      // テキストコンテンツを取得
      const text = await page.evaluate(() => {
        // scriptとstyleタグを除外
        const scripts = document.querySelectorAll('script, style');
        scripts.forEach((el: Element) => el.remove());
        
        // body要素のテキストを取得
        const body = document.body;
        if (!body) return '';
        
        // 改行や余分な空白を正規化
        return (body as HTMLElement).innerText
          .replace(/\s+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      });
      
      logger.info(`ページ取得成功: ${url}`, {
        title,
        textLength: text.length,
      });
      
      return {
        url,
        html,
        text,
        title,
        success: true,
        statusCode: status,
        fetchedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`ページ取得失敗: ${url}`, error);
      
      return {
        url,
        html: '',
        text: '',
        title: '',
        success: false,
        error: errorMessage,
      };
      
    } finally {
      // ページを閉じる
      if (page) {
        try {
          await page.close();
        } catch (e) {
          logger.debug('ページクローズエラー', e);
        }
      }
    }
  }
  
  /**
   * 複数URLを並列で取得
   */
  async fetchPages(urls: string[]): Promise<FetchResult[]> {
    const results: FetchResult[] = [];
    
    // 並列数を制限しながら取得
    for (let i = 0; i < urls.length; i += config.maxConcurrentRequests) {
      const batch = urls.slice(i, i + config.maxConcurrentRequests);
      const batchResults = await Promise.all(
        batch.map(url => this.fetchPage(url))
      );
      results.push(...batchResults);
    }
    
    return results;
  }
  
  /**
   * ブラウザを閉じる
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      logger.info('ブラウザを終了しました');
      this.browser = null;
    }
  }
}

// シングルトンインスタンス
export const fetcher = new PageFetcher();

/**
 * URLからテキストを抽出（簡易版）
 */
export async function extractTextFromUrl(url: string): Promise<string> {
  const result = await fetcher.fetchPage(url);
  
  if (!result.success) {
    throw new Error(result.error || 'ページ取得に失敗しました');
  }
  
  return result.text;
}

/**
 * 複数URLから情報を取得
 */
export async function fetchMultipleUrls(urls: string[]): Promise<Map<string, FetchResult>> {
  const results = await fetcher.fetchPages(urls);
  const resultMap = new Map<string, FetchResult>();
  
  for (const result of results) {
    resultMap.set(result.url, result);
  }
  
  return resultMap;
}