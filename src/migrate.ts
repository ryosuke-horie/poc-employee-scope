import Database from 'better-sqlite3';
import { config } from './config.js';
import { logger } from './logger.js';

/**
 * 既存のDBに新しいカラムを追加するマイグレーション
 */
export function migrateDatabase(): void {
  const db = new Database(config.dbPath);
  
  try {
    // カラムの存在チェック
    const tableInfo = db.prepare('PRAGMA table_info(evidence)').all();
    const columnNames = new Set(tableInfo.map((col: any) => col.name));
    
    // 新しいカラムを追加（存在しない場合のみ）
    const newColumns = [
      { name: 'page_title', type: 'TEXT' },
      { name: 'status_code', type: 'INTEGER' },
      { name: 'fetched_at', type: 'TEXT' },
      { name: 'snippet_start', type: 'INTEGER' },
      { name: 'snippet_end', type: 'INTEGER' },
      { name: 'error_summary', type: 'TEXT' },
    ];
    
    for (const column of newColumns) {
      if (!columnNames.has(column.name)) {
        const sql = `ALTER TABLE evidence ADD COLUMN ${column.name} ${column.type}`;
        db.exec(sql);
        logger.info(`カラムを追加しました: ${column.name}`);
      }
    }
    
    logger.info('マイグレーション完了');
  } catch (error) {
    logger.error('マイグレーションエラー', error);
    throw error;
  } finally {
    db.close();
  }
}

// 直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase();
}