#!/usr/bin/env node

import { config, validateConfig, printConfig } from './config.js';
import { logger } from './logger.js';
import { ensureDirectory, sleep } from './utils.js';
import { db } from './db.js';
import { readCompaniesFromCSV, writeResultsToCSV, printResultsSummary, type ExtractionResult } from './csv.js';
import { fetcher } from './fetcher.js';
import { join } from 'path';

async function main() {
  try {
    // コマンドライン引数の処理
    const args = process.argv.slice(2);
    const inputFile = args[0] || 'companies.csv';
    
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
    
    // CSVから企業リストを読み込み
    const companies = await readCompaniesFromCSV(inputFile);
    if (companies.length === 0) {
      logger.warn('処理する企業がありません');
      return;
    }
    
    logger.info(`${companies.length}社の処理を開始します`);
    
    // 処理結果を格納する配列
    const results: ExtractionResult[] = [];
    
    // 各企業を処理
    for (const company of companies) {
      logger.info(`処理中: ${company.company_name}`);
      
      try {
        // 企業をDBに登録
        const dbCompany = db.upsertCompany(company.company_name);
        
        // URLの確認
        if (!company.url) {
          logger.warn(`URLが指定されていません: ${company.company_name}`);
          results.push({
            company_name: company.company_name,
            employee_count: null,
            source_url: '',
            source_text: '',
            extraction_method: 'failed',
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
            error_message: 'URLが指定されていません',
          });
          continue;
        }
        
        // ページの取得
        logger.info(`ページ取得中: ${company.url}`);
        const fetchResult = await fetcher.fetchPage(company.url);
        
        if (!fetchResult.success) {
          logger.error(`ページ取得失敗: ${company.company_name}`, fetchResult.error);
          results.push({
            company_name: company.company_name,
            employee_count: null,
            source_url: company.url,
            source_text: '',
            extraction_method: 'failed',
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
            error_message: fetchResult.error,
          });
          continue;
        }
        
        // TODO: 従業員数の抽出（正規表現→LLM）
        // 現時点ではページ取得のみ
        const result: ExtractionResult = {
          company_name: company.company_name,
          employee_count: null,
          source_url: company.url,
          source_text: fetchResult.text.substring(0, 500), // 最初の500文字を保存
          extraction_method: 'failed',
          confidence_score: 0,
          extracted_at: new Date().toISOString(),
          error_message: 'Extraction not implemented yet',
        };
        
        results.push(result);
        
        // 処理間隔を設ける（サーバー負荷軽減）
        await sleep(1000);
        
        // 証跡をDBに保存
        db.insertEvidence({
          company_id: dbCompany.id!,
          value: result.employee_count,
          raw_text: result.source_text,
          source_url: result.source_url,
          source_type: 'web',
          source_date: new Date().toISOString(),
          score: result.confidence_score,
          model: config.llmProvider === 'openrouter' ? config.openRouterModelId : config.ollamaModel,
        });
        
      } catch (error) {
        logger.error(`エラー: ${company.company_name}`, error);
        results.push({
          company_name: company.company_name,
          employee_count: null,
          source_url: company.url || '',
          source_text: '',
          extraction_method: 'failed',
          confidence_score: 0,
          extracted_at: new Date().toISOString(),
          error_message: String(error),
        });
      }
    }
    
    // 結果をCSVに出力
    const outputPath = join(config.outputDir, `results_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
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