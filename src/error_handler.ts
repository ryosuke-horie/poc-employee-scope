import { logger } from './logger.js';

/**
 * エラーの種類
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  PARSE = 'PARSE',
  API = 'API',
  RATE_LIMIT = 'RATE_LIMIT',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * エラー情報
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  retryable: boolean;
  skipToNext: boolean;
  originalError?: any;
}

/**
 * エラーを分類
 */
export function classifyError(error: any): ErrorInfo {
  const errorStr = String(error);
  const message = error?.message || errorStr;
  
  // タイムアウトエラー
  if (errorStr.includes('Timeout') || errorStr.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'タイムアウトエラー',
      retryable: true,
      skipToNext: true,
      originalError: error,
    };
  }
  
  // ネットワークエラー
  if (
    errorStr.includes('ECONNREFUSED') ||
    errorStr.includes('ENOTFOUND') ||
    errorStr.includes('NetworkError') ||
    errorStr.includes('ERR_NETWORK')
  ) {
    return {
      type: ErrorType.NETWORK,
      message: 'ネットワークエラー',
      retryable: true,
      skipToNext: true,
      originalError: error,
    };
  }
  
  // レート制限エラー
  if (
    errorStr.includes('429') ||
    errorStr.includes('rate limit') ||
    errorStr.includes('Rate limit')
  ) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'レート制限エラー',
      retryable: true,
      skipToNext: false, // レート制限の場合は待機が必要
      originalError: error,
    };
  }
  
  // APIエラー
  if (
    errorStr.includes('401') ||
    errorStr.includes('403') ||
    errorStr.includes('500') ||
    errorStr.includes('API')
  ) {
    return {
      type: ErrorType.API,
      message: 'APIエラー',
      retryable: errorStr.includes('500'), // 500エラーはリトライ可能
      skipToNext: true,
      originalError: error,
    };
  }
  
  // パースエラー
  if (
    errorStr.includes('JSON') ||
    errorStr.includes('parse') ||
    errorStr.includes('Parse')
  ) {
    return {
      type: ErrorType.PARSE,
      message: 'データ解析エラー',
      retryable: false,
      skipToNext: true,
      originalError: error,
    };
  }
  
  // バリデーションエラー
  if (
    errorStr.includes('validation') ||
    errorStr.includes('Validation') ||
    errorStr.includes('Invalid')
  ) {
    return {
      type: ErrorType.VALIDATION,
      message: 'バリデーションエラー',
      retryable: false,
      skipToNext: true,
      originalError: error,
    };
  }
  
  // その他のエラー
  return {
    type: ErrorType.UNKNOWN,
    message: message,
    retryable: false,
    skipToNext: true,
    originalError: error,
  };
}

/**
 * エラーハンドリング戦略
 */
export class ErrorHandler {
  private errorCounts: Map<string, number> = new Map();
  private readonly maxErrorsPerCompany = 5;
  
  /**
   * エラーを処理して次のアクションを決定
   */
  handleError(companyName: string, error: any): {
    shouldRetry: boolean;
    shouldSkip: boolean;
    shouldAbort: boolean;
  } {
    const errorInfo = classifyError(error);
    
    // エラーカウントを更新
    const errorKey = `${companyName}:${errorInfo.type}`;
    const currentCount = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, currentCount);
    
    // ログ出力
    this.logError(companyName, errorInfo, currentCount);
    
    // 同じ企業で多数のエラーが発生している場合は処理を中止
    if (currentCount >= this.maxErrorsPerCompany) {
      logger.error(`${companyName}: エラーが多発しているため処理を中止します`);
      return {
        shouldRetry: false,
        shouldSkip: true,
        shouldAbort: true,
      };
    }
    
    // レート制限の場合は特別処理
    if (errorInfo.type === ErrorType.RATE_LIMIT) {
      logger.warn(`レート制限に達しました。しばらく待機が必要です`);
      return {
        shouldRetry: true,
        shouldSkip: false,
        shouldAbort: false,
      };
    }
    
    return {
      shouldRetry: errorInfo.retryable && currentCount < 3,
      shouldSkip: errorInfo.skipToNext,
      shouldAbort: false,
    };
  }
  
  /**
   * エラーログを出力
   */
  private logError(companyName: string, errorInfo: ErrorInfo, count: number): void {
    const logMessage = `[${companyName}] ${errorInfo.type}: ${errorInfo.message} (${count}回目)`;
    
    switch (errorInfo.type) {
      case ErrorType.NETWORK:
      case ErrorType.TIMEOUT:
        logger.warn(logMessage);
        break;
      case ErrorType.RATE_LIMIT:
        logger.warn(logMessage);
        break;
      case ErrorType.API:
      case ErrorType.PARSE:
        logger.error(logMessage, errorInfo.originalError);
        break;
      default:
        logger.error(logMessage, errorInfo.originalError);
    }
  }
  
  /**
   * エラー統計を取得
   */
  getStatistics(): Record<string, any> {
    const stats: Record<string, number> = {};
    
    for (const [key, count] of this.errorCounts) {
      const [, type] = key.split(':');
      const statKey = `${type}_errors`;
      stats[statKey] = (stats[statKey] || 0) + count;
    }
    
    return stats;
  }
  
  /**
   * エラーカウントをリセット
   */
  reset(): void {
    this.errorCounts.clear();
  }
}

// グローバルインスタンス
export const errorHandler = new ErrorHandler();