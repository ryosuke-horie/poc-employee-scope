import { promises as fs } from 'fs';
import { logger } from './logger.js';

/**
 * 指定時間待機
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * リトライ付き関数実行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < retries) {
        const waitTime = delay * Math.pow(backoff, i);
        logger.warn(`リトライ ${i + 1}/${retries} - ${waitTime}ms待機`, {
          error: lastError.message
        });
        await sleep(waitTime);
      }
    }
  }
  
  throw lastError;
}

/**
 * ディレクトリが存在しない場合は作成
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    logger.debug(`ディレクトリを作成: ${dirPath}`);
  }
}

/**
 * ファイルが存在するか確認
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * カンマ付き数字をパース
 * 例: "1,234" -> 1234
 */
export function parseNumberWithComma(text: string): number | null {
  const cleaned = text.replace(/[,，]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * テキストを指定文字数で切り詰め
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * URLが有効かチェック
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 並列処理を制限付きで実行
 */
export async function parallelLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const promise = fn(items[i], i).then(result => {
      results[i] = result;
    });
    
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
}

/**
 * エラーを安全に文字列化
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

/**
 * URLをサニタイズ
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const trimmed = url.trim();
    const urlObj = new URL(trimmed);
    
    // フラグメントを削除
    urlObj.hash = '';
    
    let result = urlObj.toString();
    
    // 末尾のスラッシュを削除（パスが/のみの場合を除く）
    if (result.endsWith('/') && urlObj.pathname !== '/') {
      result = result.slice(0, -1);
    }
    
    return result;
  } catch {
    return '';
  }
}

/**
 * 安全に整数をパース
 */
export function parseIntSafe(value: string | null | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  
  // カンマを削除
  const cleaned = value.replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * バイト数をフォーマット
 */
export function formatBytes(bytes: number | null | undefined, decimals: number = 2): string {
  if (!bytes || isNaN(bytes)) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  if (bytes < 0) {
    const absBytes = Math.abs(bytes);
    const i = Math.floor(Math.log(absBytes) / Math.log(k));
    return `-${parseFloat((absBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * ディレクトリが存在することを確認（作成も行う）
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}