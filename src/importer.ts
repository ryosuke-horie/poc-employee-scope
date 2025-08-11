import { promises as fs } from 'fs';
import { db } from './db.js';
import { logger } from './logger.js';

/**
 * レビュー結果の構造定義
 */
interface ReviewBundle {
  generated_at: string;
  companies: Array<{
    id: number;
    name: string;
  }>;
  evidence: Array<{
    id: number;
    company_id: number;
    value: number | null;
    raw_text: string;
    source_url: string;
    source_type: string;
    source_date: string | null;
    score: number;
    model: string | null;
    extracted_at: string;
    page_title?: string | null;
    status_code?: number | null;
    fetched_at?: string | null;
    snippet_start?: number | null;
    snippet_end?: number | null;
    error_summary?: string | null;
  }>;
  review_state: Array<{
    company_id: number;
    decision: 'ok' | 'ng' | 'unknown';
    decided_at: string;
    note?: string;
    override_value?: number | null;
  }>;
}

/**
 * レビュー結果をデータベースにインポート
 * @param reviewJsonPath レビュー結果JSONファイルのパス
 */
export async function importReviewResults(reviewJsonPath: string): Promise<void> {
  try {
    // JSONファイルを読み込み
    logger.info(`レビュー結果を読み込み中: ${reviewJsonPath}`);
    const jsonContent = await fs.readFile(reviewJsonPath, 'utf-8');
    const reviewData: ReviewBundle = JSON.parse(jsonContent);
    
    // データ検証
    if (!reviewData.review_state || !Array.isArray(reviewData.review_state)) {
      throw new Error('レビュー結果にreview_stateが含まれていません');
    }
    
    logger.info(`インポート対象: ${reviewData.review_state.length}件のレビュー結果`);
    
    // トランザクション内で処理
    let importedCount = 0;
    let skippedCount = 0;
    
    const processImport = () => {
      for (const reviewState of reviewData.review_state) {
        try {
          // 企業IDの存在確認
          const companyExists = db.getDb()?.prepare(
            'SELECT COUNT(*) as count FROM companies WHERE id = ?'
          ).get(reviewState.company_id) as { count: number };
          
          if (!companyExists || companyExists.count === 0) {
            logger.warn(`企業ID ${reviewState.company_id} が存在しません。スキップします。`);
            skippedCount++;
            continue;
          }
          
          // レビュー状態をupsert
          db.upsertReviewState({
            company_id: reviewState.company_id,
            decision: reviewState.decision,
            decided_at: reviewState.decided_at || new Date().toISOString(),
            note: reviewState.note,
            override_value: reviewState.override_value
          });
          
          importedCount++;
          logger.debug(`レビュー状態をインポート: company_id=${reviewState.company_id}, decision=${reviewState.decision}`);
          
        } catch (error) {
          logger.error(`レビュー状態のインポートエラー (company_id: ${reviewState.company_id})`, error);
          skippedCount++;
        }
      }
    };
    
    db.transaction(processImport);
    
    // 結果サマリー
    logger.info('レビュー結果のインポート完了', {
      total: reviewData.review_state.length,
      imported: importedCount,
      skipped: skippedCount
    });
    
    // インポート後の統計情報
    const stats = db.getStatistics();
    logger.info('データベース統計', {
      companies: stats.companies,
      evidence: stats.evidence,
      reviewed: stats.reviewed
    });
    
  } catch (error) {
    logger.error('レビュー結果のインポートに失敗しました', error);
    throw error;
  }
}

/**
 * レビュー状態の検証
 * @param reviewJsonPath レビュー結果JSONファイルのパス
 */
export async function validateReviewBundle(reviewJsonPath: string): Promise<boolean> {
  try {
    const jsonContent = await fs.readFile(reviewJsonPath, 'utf-8');
    const reviewData = JSON.parse(jsonContent);
    
    // 必須フィールドの確認
    const requiredFields = ['generated_at', 'companies', 'evidence', 'review_state'];
    for (const field of requiredFields) {
      if (!(field in reviewData)) {
        logger.error(`必須フィールド "${field}" が存在しません`);
        return false;
      }
    }
    
    // review_stateの構造確認
    if (!Array.isArray(reviewData.review_state)) {
      logger.error('review_stateが配列ではありません');
      return false;
    }
    
    for (const state of reviewData.review_state) {
      if (!state.company_id || !state.decision) {
        logger.error('review_stateに必須フィールド(company_id, decision)が不足しています');
        return false;
      }
      
      if (!['ok', 'ng', 'unknown'].includes(state.decision)) {
        logger.error(`不正なdecision値: ${state.decision}`);
        return false;
      }
    }
    
    logger.info('レビュー結果の検証に成功しました');
    return true;
    
  } catch (error) {
    logger.error('レビュー結果の検証に失敗しました', error);
    return false;
  }
}