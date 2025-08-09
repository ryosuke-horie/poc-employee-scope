#!/usr/bin/env node

import { config, validateConfig, printConfig } from './config.js';
import { logger } from './logger.js';
import { ensureDirectory } from './utils.js';

async function main() {
  try {
    // 設定の検証
    validateConfig();
    
    // 設定情報の表示
    printConfig();
    
    // 必要なディレクトリの作成
    await ensureDirectory(config.outputDir);
    await ensureDirectory('data');
    
    logger.info('従業員数取得システムを開始します');
    
    // TODO: 以下の処理を実装
    // 1. CSVから企業名リストを読み込み
    // 2. データベースの初期化
    // 3. 各企業に対して:
    //    - URL収集（SerpApiまたは固定URL）
    //    - ページ取得
    //    - 従業員数抽出（正規表現→LLM）
    //    - 結果をDBに保存
    // 4. 結果をCSVにエクスポート
    
    logger.info('処理が完了しました');
    
  } catch (error) {
    logger.error('エラーが発生しました', error);
    process.exit(1);
  }
}

// スクリプトとして直接実行された場合のみmain()を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}