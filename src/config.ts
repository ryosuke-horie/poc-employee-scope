import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込み
dotenvConfig();

export interface Config {
  // OpenRouter設定（必須）
  openRouterApiKey: string;
  openRouterModelId: string;
  
  // 実行設定
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  retryCount: number;
  
  // Playwright設定
  userAgent: string;
  navigationWaitMs: number;
  
  // データベース設定
  dbPath: string;
  
  // 出力設定
  outputDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // コスト最適化設定
  maxTextLengthForLLM: number; // LLMに送信する最大テキスト長
  preferRegexOverLLM: boolean; // 正規表現を優先
  skipLowPriorityUrls: boolean; // 低優先度URLをスキップ
  maxUrlsPerCompany: number; // 企業あたりの最大URL数
  
  // 抽出設定
  snippetContextChars: number; // 抽出スニペットの前後文字数
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  
  // テスト環境でOPENROUTER_API_KEYの場合はダミー値を返す
  if (isTestEnv && key === 'OPENROUTER_API_KEY' && !value) {
    return 'test-api-key';
  }
  
  if (!value && !defaultValue) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value || defaultValue!;
}


export const config: Config = {
  // OpenRouter設定（必須）
  openRouterApiKey: getEnvVar('OPENROUTER_API_KEY'),
  openRouterModelId: getEnvVar('OPENROUTER_MODEL_ID', 'meta-llama/llama-3.1-8b-instruct'),
  
  // 実行設定
  maxConcurrentRequests: parseInt(getEnvVar('MAX_CONCURRENT_REQUESTS', '3'), 10),
  requestTimeoutMs: parseInt(getEnvVar('REQUEST_TIMEOUT_MS', '30000'), 10),
  retryCount: parseInt(getEnvVar('RETRY_COUNT', '3'), 10),
  
  // Playwright設定
  userAgent: getEnvVar('USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'),
  navigationWaitMs: parseInt(getEnvVar('NAV_WAIT_MS', '2000'), 10),
  
  // データベース設定
  dbPath: getEnvVar('DB_PATH', join(__dirname, '../data/companies.db')),
  
  // 出力設定
  outputDir: getEnvVar('OUTPUT_DIR', join(__dirname, '../output')),
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
  
  // コスト最適化設定
  maxTextLengthForLLM: parseInt(getEnvVar('MAX_TEXT_LENGTH_FOR_LLM', '10000'), 10),
  preferRegexOverLLM: getEnvVar('PREFER_REGEX_OVER_LLM', 'true') === 'true',
  skipLowPriorityUrls: getEnvVar('SKIP_LOW_PRIORITY_URLS', 'false') === 'true',
  maxUrlsPerCompany: parseInt(getEnvVar('MAX_URLS_PER_COMPANY', '5'), 10),
  
  // 抽出設定
  snippetContextChars: parseInt(getEnvVar('SNIPPET_CONTEXT_CHARS', '200'), 10),
};

// 設定検証
export function validateConfig(): void {
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  
  // テスト環境では API キーの検証をスキップ
  if (!isTestEnv && !config.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEYが設定されていません');
  }
  
  if (config.maxConcurrentRequests < 1) {
    throw new Error('MAX_CONCURRENT_REQUESTSは1以上である必要があります');
  }
  
  if (config.requestTimeoutMs < 1000) {
    throw new Error('REQUEST_TIMEOUT_MSは1000ms以上である必要があります');
  }
  
  if (config.retryCount < 0) {
    throw new Error('RETRY_COUNTは0以上である必要があります');
  }
}

// 設定情報を表示
export function printConfig(): void {
  console.log('=== 設定情報 ===');
  console.log(`OpenRouterモデル: ${config.openRouterModelId}`);
  console.log(`APIキー設定: ✓`);
  console.log(`並列リクエスト数: ${config.maxConcurrentRequests}`);
  console.log(`タイムアウト: ${config.requestTimeoutMs}ms`);
  console.log(`リトライ回数: ${config.retryCount}`);
  console.log(`データベース: ${config.dbPath}`);
  console.log(`出力先: ${config.outputDir}`);
  console.log(`ログレベル: ${config.logLevel}`);
  console.log('--- コスト最適化設定 ---');
  console.log(`LLM最大テキスト長: ${config.maxTextLengthForLLM}文字`);
  console.log(`正規表現優先: ${config.preferRegexOverLLM ? '✓' : '✗'}`);
  console.log(`低優先度URLスキップ: ${config.skipLowPriorityUrls ? '✓' : '✗'}`);
  console.log(`企業あたり最大URL数: ${config.maxUrlsPerCompany}`);
  console.log('================\n');
}