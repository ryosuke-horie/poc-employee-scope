import { db } from './db.js';
import { logger } from './logger.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ensureDirectory } from './utils.js';
import { ReviewBundle, Company, Evidence, ReviewState } from './types/review.js';

/**
 * データベースからreview.json形式のデータを生成
 */
export async function generateReviewBundle(): Promise<ReviewBundle> {
  logger.info('review.json生成を開始します');
  
  // 企業データの取得
  const companies = db.getAllCompanies();
  const companiesData: Company[] = companies.map(c => ({
    id: c.id!,
    name: c.name
  }));
  
  // 証跡データの取得
  const allEvidence = db.getAllEvidence();
  const evidenceData: Evidence[] = allEvidence.map(e => ({
    company_id: e.company_id,
    source_url: e.source_url,
    source_type: e.source_type || 'web',
    value: e.value,
    raw_text: e.raw_text || '',
    model: e.model || null,
    score: e.score || null,
    page_title: e.page_title || null,
    // extracted_atをISO 8601形式に変換
    extracted_at: e.extracted_at ? new Date(e.extracted_at).toISOString() : new Date().toISOString(),
    status_code: e.status_code || null,
    snippet_start: e.snippet_start || null,
    snippet_end: e.snippet_end || null,
  }));
  
  // レビュー状態の取得（現時点では空配列）
  const reviewStates: ReviewState[] = [];
  
  // バンドルの作成
  const bundle: ReviewBundle = {
    generated_at: new Date().toISOString(),
    companies: companiesData,
    evidence: evidenceData,
    review_state: reviewStates,
  };
  
  logger.info(`生成完了: ${companiesData.length}社、${evidenceData.length}件の証跡`);
  
  return bundle;
}

/**
 * review.jsonファイルをエクスポート
 */
export async function exportReviewJson(outputPath?: string): Promise<string> {
  try {
    const bundle = await generateReviewBundle();
    
    // 出力先の決定
    const defaultPath = join('output', 'review', 'review.json');
    const filePath = outputPath || defaultPath;
    
    // ディレクトリの作成
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (dir) {
      await ensureDirectory(dir);
    }
    
    // ファイルへの書き込み
    const jsonContent = JSON.stringify(bundle, null, 2);
    writeFileSync(filePath, jsonContent, 'utf-8');
    
    logger.info(`review.jsonを出力しました: ${filePath}`);
    
    // frontend/publicへのコピー（オプション）
    const frontendPath = join('frontend', 'public', 'review.json');
    try {
      writeFileSync(frontendPath, jsonContent, 'utf-8');
      logger.info(`フロントエンドにもコピーしました: ${frontendPath}`);
    } catch (err) {
      logger.warn('フロントエンドへのコピーは省略されました', err);
    }
    
    return filePath;
    
  } catch (error) {
    logger.error('review.jsonのエクスポートに失敗しました', error);
    throw error;
  }
}

/**
 * CSVファイルをエクスポート（既存機能の統合）
 */
export async function exportCsv(outputPath?: string): Promise<string> {
  try {
    const results = db.getAllEvidence();
    
    // CSVヘッダー
    const headers = [
      'company_id',
      'company_name', 
      'value',
      'source_url',
      'source_type',
      'extraction_method',
      'score',
      'extracted_at',
    ];
    
    // CSV行の生成
    const rows = results.map(r => {
      const company = db.getCompany(r.company_id);
      return [
        r.company_id,
        company?.name || '',
        r.value || '',
        r.source_url,
        r.source_type || '',
        r.model ? 'llm' : 'regex',
        r.score || '',
        r.extracted_at || '',
      ];
    });
    
    // CSV文字列の生成
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // 出力先の決定
    const defaultPath = join('output', `export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
    const filePath = outputPath || defaultPath;
    
    // ファイルへの書き込み
    writeFileSync(filePath, csvContent, 'utf-8');
    
    logger.info(`CSVを出力しました: ${filePath}`);
    
    return filePath;
    
  } catch (error) {
    logger.error('CSVのエクスポートに失敗しました', error);
    throw error;
  }
}