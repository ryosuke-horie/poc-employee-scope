import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import { logger } from './logger.js';

export interface CompanyData {
  id: number;
  name: string;
}

export interface UrlData {
  company_id: number;
  url: string;
  source_type: 'official' | 'wiki' | 'ir' | 'news' | 'other';
  priority: number;
}

export interface CompanyWithUrls {
  company: CompanyData;
  urls: UrlData[];
}

/**
 * companies.csvを読み込み
 */
export async function loadCompanies(filePath: string): Promise<CompanyData[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // BOMを除去
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    
    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];
    
    // バリデーション
    const companies: CompanyData[] = [];
    for (const record of records) {
      const id = parseInt(record.id, 10);
      if (!record.id || isNaN(id)) {
        logger.warn(`無効なIDをスキップ: ${JSON.stringify(record)}`);
        continue;
      }
      if (!record.name || record.name.trim() === '') {
        logger.warn(`企業名が空のレコードをスキップ: ${JSON.stringify(record)}`);
        continue;
      }
      
      companies.push({
        id: id,
        name: record.name.trim(),
      });
    }
    
    logger.info(`${companies.length}件の企業を読み込みました`, { filePath });
    return companies;
    
  } catch (error) {
    logger.error('企業リスト読み込みエラー', error);
    throw new Error(`企業リストの読み込みに失敗: ${filePath}`);
  }
}

/**
 * urls.csvを読み込み
 */
export async function loadUrls(filePath: string): Promise<UrlData[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // BOMを除去
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    
    const records = parse(cleanContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];
    
    // バリデーション
    const urls: UrlData[] = [];
    for (const record of records) {
      const company_id = parseInt(record.company_id, 10);
      const priority = parseInt(record.priority, 10);
      
      if (!record.company_id || isNaN(company_id)) {
        logger.warn(`無効な企業IDをスキップ: ${JSON.stringify(record)}`);
        continue;
      }
      if (!record.url || record.url.trim() === '') {
        logger.warn(`URLが空のレコードをスキップ: ${JSON.stringify(record)}`);
        continue;
      }
      
      // URLの妥当性チェック
      try {
        new URL(record.url);
      } catch {
        logger.warn(`無効なURLをスキップ: ${record.url}`);
        continue;
      }
      
      urls.push({
        company_id: company_id,
        url: record.url.trim(),
        source_type: record.source_type || 'other',
        priority: isNaN(priority) ? 99 : priority,
      });
    }
    
    // 優先度順にソート
    urls.sort((a, b) => a.priority - b.priority);
    
    logger.info(`${urls.length}件のURLを読み込みました`, { filePath });
    return urls;
    
  } catch (error) {
    logger.error('URL リスト読み込みエラー', error);
    throw new Error(`URLリストの読み込みに失敗: ${filePath}`);
  }
}

/**
 * 企業とURLを結合
 */
export function mergeCompaniesWithUrls(
  companies: CompanyData[],
  urls: UrlData[]
): CompanyWithUrls[] {
  const urlMap = new Map<number, UrlData[]>();
  
  // URLを企業IDでグループ化
  for (const url of urls) {
    if (!urlMap.has(url.company_id)) {
      urlMap.set(url.company_id, []);
    }
    urlMap.get(url.company_id)!.push(url);
  }
  
  // 企業とURLを結合
  const results: CompanyWithUrls[] = [];
  for (const company of companies) {
    const companyUrls = urlMap.get(company.id) || [];
    
    if (companyUrls.length === 0) {
      logger.warn(`URLが見つかりません: ${company.name} (ID: ${company.id})`);
    }
    
    results.push({
      company,
      urls: companyUrls,
    });
  }
  
  return results;
}

/**
 * データの整合性を検証
 */
export function validateData(
  companies: CompanyData[],
  urls: UrlData[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // ヘッダー必須チェックは parse で自動的に行われる
  
  // 企業IDの重複チェック
  const companyIds = new Set<number>();
  for (const company of companies) {
    if (companyIds.has(company.id)) {
      errors.push(`重複する企業ID: ${company.id}`);
    }
    companyIds.add(company.id);
  }
  
  // URLの企業ID存在チェック
  for (const url of urls) {
    if (!companyIds.has(url.company_id)) {
      errors.push(`存在しない企業IDを参照: ${url.company_id} (URL: ${url.url})`);
    }
  }
  
  if (errors.length > 0) {
    logger.error('データ検証エラー', errors);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}