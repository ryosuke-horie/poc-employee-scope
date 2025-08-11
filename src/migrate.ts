import Database from 'better-sqlite3';
import { config } from './config.js';
import { logger } from './logger.js';
import { dirname } from 'path';
import { ensureDirectory } from './utils.js';

/**
 * データベースマイグレーション
 * 既存のテーブルに review_state テーブルを追加
 */
async function migrate() {
  try {
    // データベースディレクトリを作成
    await ensureDirectory(dirname(config.dbPath));
    
    // データベース接続
    const db = new Database(config.dbPath);
    logger.info(`データベースに接続しました: ${config.dbPath}`);
    
    // 現在のスキーマをチェック
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='review_state'
    `).all();
    
    if (tables.length > 0) {
      logger.info('review_state テーブルは既に存在します');
      db.close();
      return;
    }
    
    // review_stateテーブルを作成
    logger.info('review_state テーブルを作成します...');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS review_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL UNIQUE,
        decision TEXT NOT NULL CHECK(decision IN ('ok', 'ng', 'unknown')),
        decided_at TEXT NOT NULL,
        note TEXT,
        override_value INTEGER,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // インデックスを作成
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_review_state_company_id ON review_state(company_id);
    `);
    
    logger.info('review_state テーブルを作成しました');
    
    // 統計情報を表示
    const stats = {
      companies: (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count,
      evidence: (db.prepare('SELECT COUNT(*) as count FROM evidence').get() as { count: number }).count,
      review_state: (db.prepare('SELECT COUNT(*) as count FROM review_state').get() as { count: number }).count,
    };
    
    logger.info('マイグレーション完了', stats);
    
    db.close();
    logger.info('データベース接続を閉じました');
    
  } catch (error) {
    logger.error('マイグレーションエラー', error);
    process.exit(1);
  }
}

// 直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate();
}

export { migrate };