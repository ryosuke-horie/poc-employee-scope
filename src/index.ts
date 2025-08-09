#!/usr/bin/env node

import { config, validateConfig, printConfig } from './config.js';
import { logger } from './logger.js';
import { ensureDirectory, sleep } from './utils.js';
import { db } from './db.js';
import { writeResultsToCSV, printResultsSummary, type ExtractionResult } from './csv.js';
import { loadCompanies, loadUrls, mergeCompaniesWithUrls, validateData } from './csv_loader.js';
import { parseCliArgs } from './cli.js';
import { fetcher } from './fetcher.js';
import { extractEmployeeCountByRegex } from './extractor_regex.js';
import { extractEmployeeCountByOpenRouter } from './extractor_llm_openrouter.js';
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
    
    logger.info(`${companiesWithUrls.length}社の処理を開始します`);
    
    // 処理結果を格納する配列
    const results: ExtractionResult[] = [];
    
    // 各企業を処理
    for (const companyWithUrls of companiesWithUrls) {
      const { company, urls: companyUrls } = companyWithUrls;
      logger.info(`処理中: ${company.name} (${companyUrls.length}個のURL)`);
      
      try {
        // 企業をDBに登録
        const dbCompany = db.upsertCompany(company.name);
        
        // URLの確認
        if (companyUrls.length === 0) {
          logger.warn(`URLが指定されていません: ${company.name}`);
          results.push({
            company_name: company.name,
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
        
        // 優先度順にURLを処理
        let finalResult: ExtractionResult | null = null;
        
        for (const urlData of companyUrls) {
          logger.info(`ページ取得中: ${urlData.url} (${urlData.source_type})`);
          const fetchResult = await fetcher.fetchPage(urlData.url);
          
          if (!fetchResult.success) {
            logger.warn(`ページ取得失敗: ${urlData.url}`, fetchResult.error);
            continue;
          }
          
          // 従業員数の抽出（正規表現→LLM）
          logger.info('従業員数を抽出中...');
          
          // 1. まず正規表現で抽出を試みる
          const regexResult = extractEmployeeCountByRegex(fetchResult.text);
          
          if (regexResult.found && regexResult.value !== null) {
            // 正規表現で抽出成功
            logger.info(`正規表現で抽出成功: ${regexResult.value}人`);
            finalResult = {
              company_name: company.name,
              employee_count: regexResult.value,
              source_url: urlData.url,
              source_text: regexResult.rawText,
              extraction_method: 'regex',
              confidence_score: regexResult.confidence,
              extracted_at: new Date().toISOString(),
            };
            break; // 抽出成功したので終了
          }
          
          // 2. 正規表現で見つからない場合はLLMを使用
          logger.info('正規表現で見つからないためLLMを使用');
          
          try {
            const llmResult = await extractEmployeeCountByOpenRouter(fetchResult.text);
            
            if (llmResult.found && llmResult.value !== null) {
              // LLMで抽出成功
              logger.info(`LLMで抽出成功: ${llmResult.value}人`);
              finalResult = {
                company_name: company.name,
                employee_count: llmResult.value,
                source_url: urlData.url,
                source_text: llmResult.rawText || fetchResult.text.substring(0, 500),
                extraction_method: 'llm',
                confidence_score: llmResult.confidence,
                extracted_at: new Date().toISOString(),
              };
              break; // 抽出成功したので終了
            }
          } catch (llmError) {
            logger.error('LLM抽出エラー', llmError);
          }
          
          // 3. どちらでも抽出できなかった場合
          finalResult = {
            company_name: company.name,
            employee_count: null,
            source_url: urlData.url,
            source_text: fetchResult.text.substring(0, 500),
            extraction_method: 'failed',
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
            error_message: '従業員数を抽出できませんでした',
          };
        }
        
        if (finalResult) {
          results.push(finalResult);
        } else {
          results.push({
            company_name: company.name,
            employee_count: null,
            source_url: companyUrls[0]?.url || '',
            source_text: '',
            extraction_method: 'failed',
            confidence_score: 0,
            extracted_at: new Date().toISOString(),
            error_message: 'すべてのURLでページ取得に失敗',
          });
        }
        
        // 処理間隔を設ける（サーバー負荷軽減）
        await sleep(1000);
        
        // 証跡をDBに保存
        if (finalResult) {
          db.insertEvidence({
            company_id: dbCompany.id!,
            value: finalResult.employee_count,
            raw_text: finalResult.source_text,
            source_url: finalResult.source_url,
            source_type: 'web',
            source_date: new Date().toISOString(),
            score: finalResult.confidence_score,
            model: config.llmProvider === 'openrouter' ? config.openRouterModelId : config.ollamaModel,
          });
        }
        
      } catch (error) {
        logger.error(`エラー: ${company.name}`, error);
        results.push({
          company_name: company.name,
          employee_count: null,
          source_url: companyUrls[0]?.url || '',
          source_text: '',
          extraction_method: 'failed',
          confidence_score: 0,
          extracted_at: new Date().toISOString(),
          error_message: String(error),
        });
      }
    }
    
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