import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .envファイルを読み込み
dotenvConfig();

export interface Config {
  // LLMプロバイダー設定
  llmProvider: 'openrouter' | 'ollama';
  
  // OpenRouter設定
  openRouterApiKey?: string;
  openRouterModelId: string;
  
  // Ollama設定
  ollamaModel: string;
  ollamaBaseUrl: string;
  
  // SerpApi設定
  serpApiKey?: string;
  
  // 実行設定
  maxConcurrentRequests: number;
  requestTimeoutMs: number;
  retryCount: number;
  
  // データベース設定
  dbPath: string;
  
  // 出力設定
  outputDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value || defaultValue!;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

export const config: Config = {
  // LLMプロバイダー設定
  llmProvider: (process.env.LLM_PROVIDER || 'openrouter') as 'openrouter' | 'ollama',
  
  // OpenRouter設定
  openRouterApiKey: getOptionalEnvVar('OPENROUTER_API_KEY'),
  openRouterModelId: getEnvVar('OPENROUTER_MODEL_ID', 'meta-llama/llama-3.1-8b-instruct'),
  
  // Ollama設定
  ollamaModel: getEnvVar('OLLAMA_MODEL', 'llama3.1:8b'),
  ollamaBaseUrl: getEnvVar('OLLAMA_BASE_URL', 'http://localhost:11434'),
  
  // SerpApi設定
  serpApiKey: getOptionalEnvVar('SERPAPI_KEY'),
  
  // 実行設定
  maxConcurrentRequests: parseInt(getEnvVar('MAX_CONCURRENT_REQUESTS', '3'), 10),
  requestTimeoutMs: parseInt(getEnvVar('REQUEST_TIMEOUT_MS', '30000'), 10),
  retryCount: parseInt(getEnvVar('RETRY_COUNT', '3'), 10),
  
  // データベース設定
  dbPath: getEnvVar('DB_PATH', join(__dirname, '../data/companies.db')),
  
  // 出力設定
  outputDir: getEnvVar('OUTPUT_DIR', join(__dirname, '../output')),
  logLevel: (process.env.LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
};

// 設定検証
export function validateConfig(): void {
  if (config.llmProvider === 'openrouter' && !config.openRouterApiKey) {
    throw new Error('OpenRouter使用時はOPENROUTER_API_KEYが必要です');
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
  console.log(`LLMプロバイダー: ${config.llmProvider}`);
  
  if (config.llmProvider === 'openrouter') {
    console.log(`OpenRouterモデル: ${config.openRouterModelId}`);
    console.log(`APIキー設定: ${config.openRouterApiKey ? '✓' : '✗'}`);
  } else {
    console.log(`Ollamaモデル: ${config.ollamaModel}`);
    console.log(`Ollama URL: ${config.ollamaBaseUrl}`);
  }
  
  console.log(`SerpApi設定: ${config.serpApiKey ? '✓' : '✗ (固定URLを使用)'}`);
  console.log(`並列リクエスト数: ${config.maxConcurrentRequests}`);
  console.log(`タイムアウト: ${config.requestTimeoutMs}ms`);
  console.log(`リトライ回数: ${config.retryCount}`);
  console.log(`データベース: ${config.dbPath}`);
  console.log(`出力先: ${config.outputDir}`);
  console.log(`ログレベル: ${config.logLevel}`);
  console.log('================\n');
}