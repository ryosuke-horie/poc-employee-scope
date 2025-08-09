#!/usr/bin/env node

import { config, validateConfig, printConfig } from './config.js';
import { logger } from './logger.js';
import { ensureDirectory } from './utils.js';
import { db } from './db.js';
import { writeResultsToCSV, printResultsSummary } from './csv.js';
import { loadCompanies, loadUrls, mergeCompaniesWithUrls, validateData } from './csv_loader.js';
import { parseCliArgs } from './cli.js';
import { fetcher } from './fetcher.js';
import { processCompaniesInParallel, estimateProcessingTime } from './processor.js';
import { join } from 'path';

async function main() {
  try {
    // コマンドライン引数の処理
    const cliOptions = parseCliArgs();
    
    // 設定の検証
    validateConfig();
    
    // 設定情報の表示
    printConfig();
    
    // 必要なディレクトリの作成
    await ensureDirectory(config.outputDir);
    await ensureDirectory('data');
    
    logger.info('従業員数取得システムを開始します');
    
    // データベースの初期化
    await db.initialize();
    
    // Playwrightの初期化
    await fetcher.initialize();
    
    // データファイルを読み込み
    const companies = await loadCompanies(cliOptions.companiesPath);
    const urls = await loadUrls(cliOptions.urlsPath);
    
    // データの検証
    const validation = validateData(companies, urls);
    if (!validation.valid) {
      logger.error('データ検証に失敗しました', validation.errors);
      throw new Error('データ検証エラー');
    }
    
    // 企業とURLを結合
    const companiesWithUrls = mergeCompaniesWithUrls(companies, urls);
    
    if (companiesWithUrls.length === 0) {
      logger.warn('処理する企業がありません');
      return;
    }
    
    // 処理時間の推定
    const estimatedTime = estimateProcessingTime(companiesWithUrls.length);
    logger.info(`${companiesWithUrls.length}社の処理を開始します（推定時間: ${estimatedTime}）`);
    
    // 並列処理で各企業を処理
    const results = await processCompaniesInParallel(companiesWithUrls, {
      maxConcurrent: cliOptions.parallel || config.maxConcurrentRequests,
    });
    
    // 結果をCSVに出力
    const outputPath = cliOptions.outputPath || 
      join(config.outputDir, `results_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    await writeResultsToCSV(results, outputPath);
    
    // サマリーを表示
    printResultsSummary(results);
    
    // DB統計を表示
    const stats = db.getStatistics();
    logger.info('データベース統計', stats);
    
    logger.info('処理が完了しました');
    
  } catch (error) {
    logger.error('エラーが発生しました', error);
    process.exit(1);
  } finally {
    // ブラウザを閉じる
    await fetcher.close();
    // データベース接続を閉じる
    db.close();
  }
}

// スクリプトとして直接実行された場合のみmain()を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}