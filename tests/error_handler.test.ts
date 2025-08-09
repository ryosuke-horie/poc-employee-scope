import { describe, it, expect, beforeEach } from 'vitest';
import { 
  classifyError, 
  ErrorType, 
  ErrorHandler 
} from '../src/error_handler.js';

describe('classifyError', () => {
  it('タイムアウトエラーを正しく分類', () => {
    const error = new Error('Request Timeout');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.TIMEOUT);
    expect(result.retryable).toBe(true);
    expect(result.skipToNext).toBe(true);
  });

  it('ネットワークエラーを正しく分類', () => {
    const error = new Error('ECONNREFUSED');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.NETWORK);
    expect(result.retryable).toBe(true);
    expect(result.skipToNext).toBe(true);
  });

  it('レート制限エラーを正しく分類', () => {
    const error = new Error('429 Too Many Requests');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.RATE_LIMIT);
    expect(result.retryable).toBe(true);
    expect(result.skipToNext).toBe(false); // レート制限は待機が必要
  });

  it('APIエラーを正しく分類', () => {
    const error401 = new Error('401 Unauthorized');
    const result401 = classifyError(error401);
    
    expect(result401.type).toBe(ErrorType.API);
    expect(result401.retryable).toBe(false); // 401はリトライ不可
    
    const error500 = new Error('500 Internal Server Error');
    const result500 = classifyError(error500);
    
    expect(result500.type).toBe(ErrorType.API);
    expect(result500.retryable).toBe(true); // 500はリトライ可能
  });

  it('JSONパースエラーを正しく分類', () => {
    const error = new Error('JSON parse error at position 123');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.PARSE);
    expect(result.retryable).toBe(false);
    expect(result.skipToNext).toBe(true);
  });

  it('バリデーションエラーを正しく分類', () => {
    const error = new Error('Validation failed: Invalid input');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.VALIDATION);
    expect(result.retryable).toBe(false);
    expect(result.skipToNext).toBe(true);
  });

  it('不明なエラーを正しく分類', () => {
    const error = new Error('Something went wrong');
    const result = classifyError(error);
    
    expect(result.type).toBe(ErrorType.UNKNOWN);
    expect(result.retryable).toBe(false);
    expect(result.skipToNext).toBe(true);
  });
});

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('handleError', () => {
    it('初回エラーはリトライを推奨', () => {
      const error = new Error('Network error');
      const action = errorHandler.handleError('TestCompany', error);
      
      expect(action.shouldRetry).toBe(true);
      expect(action.shouldSkip).toBe(true);
      expect(action.shouldAbort).toBe(false);
    });

    it('3回目のエラーでリトライを停止', () => {
      const error = new Error('Network error');
      const company = 'TestCompany';
      
      // 1回目と2回目
      errorHandler.handleError(company, error);
      errorHandler.handleError(company, error);
      
      // 3回目
      const action = errorHandler.handleError(company, error);
      
      expect(action.shouldRetry).toBe(false); // 3回目でリトライ停止
      expect(action.shouldSkip).toBe(true);
    });

    it('多数のエラーで処理を中止', () => {
      const company = 'TestCompany';
      
      // 5回エラーを発生させる
      for (let i = 0; i < 4; i++) {
        errorHandler.handleError(company, new Error(`Error ${i}`));
      }
      
      // 5回目で中止
      const action = errorHandler.handleError(company, new Error('Error 5'));
      
      expect(action.shouldAbort).toBe(true);
    });

    it('レート制限エラーは特別処理', () => {
      const error = new Error('429 rate limit exceeded');
      const action = errorHandler.handleError('TestCompany', error);
      
      expect(action.shouldRetry).toBe(true);
      expect(action.shouldSkip).toBe(false); // レート制限はスキップしない
      expect(action.shouldAbort).toBe(false);
    });

    it('リトライ不可能なエラーはリトライしない', () => {
      const error = new Error('401 Unauthorized');
      const action = errorHandler.handleError('TestCompany', error);
      
      expect(action.shouldRetry).toBe(false);
      expect(action.shouldSkip).toBe(true);
    });
  });

  describe('getStatistics', () => {
    it('エラー統計を正しく集計', () => {
      const errorHandler = new ErrorHandler();
      
      errorHandler.handleError('Company1', new Error('Network error'));
      errorHandler.handleError('Company1', new Error('Timeout'));
      errorHandler.handleError('Company2', new Error('Network error'));
      errorHandler.handleError('Company2', new Error('429 rate limit'));
      
      const stats = errorHandler.getStatistics();
      
      expect(stats['NETWORK_errors']).toBe(2);
      expect(stats['TIMEOUT_errors']).toBe(1);
      expect(stats['RATE_LIMIT_errors']).toBe(1);
    });

    it('統計をリセットできる', () => {
      const errorHandler = new ErrorHandler();
      
      errorHandler.handleError('Company1', new Error('Network error'));
      errorHandler.handleError('Company2', new Error('Timeout'));
      
      const statsBefore = errorHandler.getStatistics();
      expect(Object.keys(statsBefore).length).toBeGreaterThan(0);
      
      errorHandler.reset();
      
      const statsAfter = errorHandler.getStatistics();
      expect(Object.keys(statsAfter).length).toBe(0);
    });
  });
});