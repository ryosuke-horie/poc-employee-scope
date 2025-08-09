import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { logger } from './logger.js';

export interface CompanyInput {
  company_name: string;
  url?: string;
}

export interface ExtractionResult {
  company_name: string;
  employee_count: number | null;
  source_url: string;
  source_text: string;
  extraction_method: 'regex' | 'llm' | 'failed';
  confidence_score: number;
  extracted_at: string;
  error_message?: string;
}

/**
 * CSVファイルから企業リストを読み込み
 */
export async function readCompaniesFromCSV(filePath: string): Promise<CompanyInput[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CompanyInput[];
    
    logger.info(`${records.length}件の企業を読み込みました`, { filePath });
    
    // データ検証
    const validRecords = records.filter(record => {
      if (!record.company_name || record.company_name.trim() === '') {
        logger.warn('企業名が空のレコードをスキップ', record);
        return false;
      }
      return true;
    });
    
    return validRecords;
  } catch (error) {
    logger.error('CSV読み込みエラー', error);
    throw new Error(`CSVファイルの読み込みに失敗: ${filePath}`);
  }
}

/**
 * 抽出結果をCSVファイルに出力
 */
export async function writeResultsToCSV(
  results: ExtractionResult[],
  outputPath: string
): Promise<void> {
  try {
    const csvContent = stringify(results, {
      header: true,
      columns: [
        'company_name',
        'employee_count',
        'source_url',
        'source_text',
        'extraction_method',
        'confidence_score',
        'extracted_at',
        'error_message',
      ],
    });
    
    await fs.writeFile(outputPath, csvContent, 'utf-8');
    logger.info(`結果を出力しました: ${outputPath}`);
  } catch (error) {
    logger.error('CSV出力エラー', error);
    throw new Error(`CSVファイルの出力に失敗: ${outputPath}`);
  }
}

/**
 * 結果のサマリーを表示
 */
export function printResultsSummary(results: ExtractionResult[]): void {
  const successful = results.filter(r => r.employee_count !== null);
  const byMethod = {
    regex: results.filter(r => r.extraction_method === 'regex'),
    llm: results.filter(r => r.extraction_method === 'llm'),
    failed: results.filter(r => r.extraction_method === 'failed'),
  };
  
  console.log('\n=== 抽出結果サマリー ===');
  console.log(`処理企業数: ${results.length}`);
  console.log(`成功: ${successful.length} (${(successful.length / results.length * 100).toFixed(1)}%)`);
  console.log(`  - 正規表現: ${byMethod.regex.length}`);
  console.log(`  - LLM: ${byMethod.llm.length}`);
  console.log(`失敗: ${byMethod.failed.length}`);
  console.log('========================\n');
}