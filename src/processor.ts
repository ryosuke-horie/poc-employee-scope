import { logger } from './logger.js';
import { config } from './config.js';
import { db } from './db.js';
import { fetcher } from './fetcher.js';
import { extractEmployeeCountByRegex } from './extractor_regex.js';
import { extractEmployeeCountByOpenRouter } from './extractor_llm_openrouter.js';
import { type ExtractionResult } from './csv.js';
import { type CompanyWithUrls } from './csv_loader.js';
import { parallelLimit } from './utils.js';
import { printUrlSummary } from './url_manager.js';

export interface ProcessingOptions {
  maxConcurrent?: number;
  delayBetween?: number;
}

/**
 * 単一企業の処理
 */
async function processCompany(
  companyWithUrls: CompanyWithUrls
): Promise<ExtractionResult> {
  const { company, urls: companyUrls } = companyWithUrls;
  
  try {
    // 企業をDBに登録
    const dbCompany = db.upsertCompany(company.name);
    
    // URLの確認
    if (companyUrls.length === 0) {
      logger.warn(`URLが指定されていません: ${company.name}`);
      return {
        company_name: company.name,
        employee_count: null,
        source_url: '',
        source_text: '',
        extraction_method: 'failed',
        confidence_score: 0,
        extracted_at: new Date().toISOString(),
        error_message: 'URLが指定されていません',
      };
    }
    
    // URL構成のサマリーを表示
    printUrlSummary(company.name, companyUrls);
    
    // 優先度順にURLを処理（すでにソート済み）
    let successfulExtraction = false;
    
    for (let i = 0; i < companyUrls.length; i++) {
      const urlData = companyUrls[i];
      const isLastUrl = i === companyUrls.length - 1;
      
      logger.info(`[${i + 1}/${companyUrls.length}] ページ取得中: ${urlData.url} (${urlData.source_type}, 優先度: ${urlData.priority})`);
      
      const fetchResult = await fetcher.fetchPage(urlData.url);
      
      if (!fetchResult.success) {
        logger.warn(`ページ取得失敗: ${urlData.url}`, fetchResult.error);
        
        // 最後のURLでなければ次のURLにフォールバック
        if (!isLastUrl) {
          logger.info(`次のURLにフォールバック (${companyUrls[i + 1].url})`);
        }
        continue;
      }
      
      // 従業員数の抽出（正規表現→LLM）
      logger.info('従業員数を抽出中...');
      
      // 1. まず正規表現で抽出を試みる
      const regexResult = extractEmployeeCountByRegex(fetchResult.text);
      
      if (regexResult.found && regexResult.value !== null) {
        // 正規表現で抽出成功
        logger.info(`✓ 正規表現で抽出成功: ${regexResult.value}人 (${company.name})`);
        successfulExtraction = true;
        
        // 証跡をDBに保存
        db.insertEvidence({
          company_id: dbCompany.id!,
          value: regexResult.value,
          raw_text: regexResult.rawText,
          source_url: urlData.url,
          source_type: urlData.source_type === 'official' ? 'web' : 
                       urlData.source_type === 'wiki' ? 'api' : 'web',
          source_date: new Date().toISOString(),
          score: regexResult.confidence,
          model: 'regex',
        });
        
        return {
          company_name: company.name,
          employee_count: regexResult.value,
          source_url: urlData.url,
          source_text: regexResult.rawText,
          extraction_method: 'regex',
          confidence_score: regexResult.confidence,
          extracted_at: new Date().toISOString(),
        };
      }
      
      // 2. 正規表現で見つからない場合はLLMを使用
      if (config.llmProvider === 'openrouter' && config.openRouterApiKey) {
        logger.info('正規表現で見つからないためLLMを使用');
        
        try {
          const llmResult = await extractEmployeeCountByOpenRouter(fetchResult.text);
          
          if (llmResult.found && llmResult.value !== null) {
            // LLMで抽出成功
            logger.info(`✓ LLMで抽出成功: ${llmResult.value}人 (${company.name})`);
            successfulExtraction = true;
            
            // 証跡をDBに保存
            db.insertEvidence({
              company_id: dbCompany.id!,
              value: llmResult.value,
              raw_text: llmResult.rawText || fetchResult.text.substring(0, 500),
              source_url: urlData.url,
              source_type: urlData.source_type === 'official' ? 'web' : 
                           urlData.source_type === 'wiki' ? 'api' : 'web',
              source_date: new Date().toISOString(),
              score: llmResult.confidence,
              model: llmResult.model,
            });
            
            return {
              company_name: company.name,
              employee_count: llmResult.value,
              source_url: urlData.url,
              source_text: llmResult.rawText || fetchResult.text.substring(0, 500),
              extraction_method: 'llm',
              confidence_score: llmResult.confidence,
              extracted_at: new Date().toISOString(),
            };
          }
        } catch (llmError) {
          logger.error('LLM抽出エラー', llmError);
        }
      }
      
      // このURLでは抽出できなかった場合
      if (!successfulExtraction && !isLastUrl) {
        logger.info(`このURLでは抽出できませんでした。次のURLにフォールバック (${companyUrls[i + 1].url})`);
      }
    }
    
    // すべてのURLで抽出できなかった場合
    logger.warn(`従業員数を抽出できませんでした: ${company.name}`);
    
    // 失敗も記録
    const firstUrl = companyUrls[0];
    db.insertEvidence({
      company_id: dbCompany.id!,
      value: null,
      raw_text: '',
      source_url: firstUrl?.url || '',
      source_type: 'web',
      source_date: new Date().toISOString(),
      score: 0,
      model: 'none',
    });
    
    return {
      company_name: company.name,
      employee_count: null,
      source_url: firstUrl?.url || '',
      source_text: '',
      extraction_method: 'failed',
      confidence_score: 0,
      extracted_at: new Date().toISOString(),
      error_message: '従業員数を抽出できませんでした',
    };
    
  } catch (error) {
    logger.error(`エラー: ${company.name}`, error);
    return {
      company_name: company.name,
      employee_count: null,
      source_url: companyUrls[0]?.url || '',
      source_text: '',
      extraction_method: 'failed',
      confidence_score: 0,
      extracted_at: new Date().toISOString(),
      error_message: String(error),
    };
  }
}

/**
 * 複数企業を並列処理
 */
export async function processCompaniesInParallel(
  companiesWithUrls: CompanyWithUrls[],
  options: ProcessingOptions = {}
): Promise<ExtractionResult[]> {
  const maxConcurrent = options.maxConcurrent || config.maxConcurrentRequests;
  
  logger.info(`${companiesWithUrls.length}社を並列処理開始（最大${maxConcurrent}並列）`);
  
  const startTime = Date.now();
  
  // 並列処理
  const results = await parallelLimit(
    companiesWithUrls,
    maxConcurrent,
    async (companyWithUrls, index) => {
      logger.info(`処理中 [${index + 1}/${companiesWithUrls.length}]: ${companyWithUrls.company.name}`);
      const result = await processCompany(companyWithUrls);
      
      // 成功/失敗をログ
      if (result.employee_count !== null) {
        logger.info(`✓ 完了: ${companyWithUrls.company.name} (${result.employee_count}人)`);
      } else {
        logger.warn(`✗ 失敗: ${companyWithUrls.company.name}`);
      }
      
      return result;
    }
  );
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const successCount = results.filter(r => r.employee_count !== null).length;
  
  logger.info(`処理完了: ${elapsed}秒で${companiesWithUrls.length}社処理（成功: ${successCount}社）`);
  
  return results;
}

/**
 * 処理速度の推定
 */
export function estimateProcessingTime(
  companyCount: number,
  maxConcurrent: number = config.maxConcurrentRequests
): string {
  // 1社あたり平均5秒と仮定
  const avgTimePerCompany = 5;
  const estimatedSeconds = Math.ceil(companyCount / maxConcurrent) * avgTimePerCompany;
  
  if (estimatedSeconds < 60) {
    return `約${estimatedSeconds}秒`;
  } else if (estimatedSeconds < 3600) {
    return `約${Math.ceil(estimatedSeconds / 60)}分`;
  } else {
    return `約${(estimatedSeconds / 3600).toFixed(1)}時間`;
  }
}