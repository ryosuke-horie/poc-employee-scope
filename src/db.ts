import Database from 'better-sqlite3';
import { config } from './config.js';
import { logger } from './logger.js';
import { dirname } from 'path';
import { ensureDirectory } from './utils.js';

export interface Company {
  id?: number;
  name: string;
}

export interface Evidence {
  id?: number;
  company_id: number;
  value: number | null;
  raw_text: string;
  source_url: string;
  source_type: 'web' | 'api' | 'manual';
  source_date: string;
  score: number;
  model?: string;
  extracted_at?: string;
  page_title?: string;
  status_code?: number;
  fetched_at?: string;
  snippet_start?: number;
  snippet_end?: number;
  error_summary?: string;
}

export interface ReviewState {
  id?: number;
  company_id: number;
  decision: 'ok' | 'ng' | 'unknown';
  decided_at: string;
  note?: string;
  override_value?: number | null;
}

class DatabaseManager {
  private db: Database.Database | null = null;
  
  /**
   * データベースインスタンスを取得（内部使用）
   */
  getDb(): Database.Database | null {
    return this.db;
  }
  
  /**
   * データベース接続を初期化
   */
  async initialize(): Promise<void> {
    try {
      // データベースディレクトリを作成
      await ensureDirectory(dirname(config.dbPath));
      
      // データベース接続
      this.db = new Database(config.dbPath);
      logger.info(`データベースに接続しました: ${config.dbPath}`);
      
      // テーブル作成
      this.createTables();
      
      // プリペアドステートメントの準備
      this.prepareStatements();
    } catch (error) {
      logger.error('データベース初期化エラー', error);
      throw error;
    }
  }
  
  /**
   * テーブルを作成
   */
  private createTables(): void {
    if (!this.db) throw new Error('データベースが初期化されていません');
    
    // companiesテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);
    
    // evidenceテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL,
        value INTEGER,
        raw_text TEXT,
        source_url TEXT,
        source_type TEXT CHECK(source_type IN ('web', 'api', 'manual')),
        source_date TEXT,
        score REAL,
        model TEXT,
        extracted_at TEXT DEFAULT CURRENT_TIMESTAMP,
        page_title TEXT,
        status_code INTEGER,
        fetched_at TEXT,
        snippet_start INTEGER,
        snippet_end INTEGER,
        error_summary TEXT,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // review_stateテーブル
    this.db.exec(`
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
    
    // インデックス作成
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_evidence_company_id ON evidence(company_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_extracted_at ON evidence(extracted_at);
      CREATE INDEX IF NOT EXISTS idx_review_state_company_id ON review_state(company_id);
    `);
    
    logger.debug('テーブルを作成しました');
  }
  
  /**
   * プリペアドステートメントを準備
   */
  private preparedStatements: {
    insertCompany?: Database.Statement;
    selectCompany?: Database.Statement;
    insertEvidence?: Database.Statement;
    selectEvidence?: Database.Statement;
    selectAllEvidence?: Database.Statement;
    upsertReviewState?: Database.Statement;
    selectReviewState?: Database.Statement;
    selectAllReviewStates?: Database.Statement;
    deleteReviewState?: Database.Statement;
  } = {};
  
  private prepareStatements(): void {
    if (!this.db) throw new Error('データベースが初期化されていません');
    
    this.preparedStatements = {
      insertCompany: this.db.prepare(
        'INSERT OR IGNORE INTO companies (name) VALUES (?)'
      ),
      selectCompany: this.db.prepare(
        'SELECT * FROM companies WHERE name = ?'
      ),
      insertEvidence: this.db.prepare(`
        INSERT INTO evidence (
          company_id, value, raw_text, source_url, 
          source_type, source_date, score, model,
          page_title, status_code, fetched_at, 
          snippet_start, snippet_end, error_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `),
      selectEvidence: this.db.prepare(
        'SELECT * FROM evidence WHERE company_id = ? ORDER BY extracted_at DESC'
      ),
      selectAllEvidence: this.db.prepare(`
        SELECT 
          c.name as company_name,
          e.*
        FROM evidence e
        JOIN companies c ON e.company_id = c.id
        ORDER BY e.extracted_at DESC
      `),
      upsertReviewState: this.db.prepare(`
        INSERT OR REPLACE INTO review_state (
          company_id, decision, decided_at, note, override_value
        ) VALUES (?, ?, ?, ?, ?)
      `),
      selectReviewState: this.db.prepare(
        'SELECT * FROM review_state WHERE company_id = ?'
      ),
      selectAllReviewStates: this.db.prepare(`
        SELECT 
          c.name as company_name,
          r.*
        FROM review_state r
        JOIN companies c ON r.company_id = c.id
        ORDER BY r.decided_at DESC
      `),
      deleteReviewState: this.db.prepare(
        'DELETE FROM review_state WHERE company_id = ?'
      ),
    };
  }
  
  /**
   * 企業を追加または取得
   */
  upsertCompany(name: string): Company {
    if (!this.db || !this.preparedStatements.insertCompany || !this.preparedStatements.selectCompany) {
      throw new Error('データベースが初期化されていません');
    }
    
    // 挿入を試みる（既存の場合は無視）
    this.preparedStatements.insertCompany.run(name);
    
    // 企業情報を取得
    const company = this.preparedStatements.selectCompany.get(name) as Company;
    return company;
  }
  
  /**
   * 証跡を追加
   */
  insertEvidence(evidence: Omit<Evidence, 'id' | 'extracted_at'>): void {
    if (!this.db || !this.preparedStatements.insertEvidence) {
      throw new Error('データベースが初期化されていません');
    }
    
    this.preparedStatements.insertEvidence.run(
      evidence.company_id,
      evidence.value,
      evidence.raw_text,
      evidence.source_url,
      evidence.source_type,
      evidence.source_date,
      evidence.score,
      evidence.model || null,
      evidence.page_title || null,
      evidence.status_code || null,
      evidence.fetched_at || null,
      evidence.snippet_start || null,
      evidence.snippet_end || null,
      evidence.error_summary || null
    );
    
    logger.debug('証跡を保存しました', { company_id: evidence.company_id });
  }
  
  /**
   * 企業の証跡を取得
   */
  getEvidenceByCompany(companyId: number): Evidence[] {
    if (!this.db || !this.preparedStatements.selectEvidence) {
      throw new Error('データベースが初期化されていません');
    }
    
    return this.preparedStatements.selectEvidence.all(companyId) as Evidence[];
  }
  
  /**
   * すべての証跡を取得（結果エクスポート用）
   */
  getAllEvidence(): any[] {
    if (!this.db || !this.preparedStatements.selectAllEvidence) {
      throw new Error('データベースが初期化されていません');
    }
    
    return this.preparedStatements.selectAllEvidence.all();
  }
  
  /**
   * トランザクション実行
   */
  transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error('データベースが初期化されていません');
    
    const transaction = this.db.transaction(fn);
    return transaction();
  }
  
  /**
   * データベース接続を閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      logger.info('データベース接続を閉じました');
    }
  }
  
  /**
   * レビュー状態を保存または更新
   */
  upsertReviewState(reviewState: Omit<ReviewState, 'id'>): void {
    if (!this.db || !this.preparedStatements.upsertReviewState) {
      throw new Error('データベースが初期化されていません');
    }
    
    this.preparedStatements.upsertReviewState.run(
      reviewState.company_id,
      reviewState.decision,
      reviewState.decided_at,
      reviewState.note || null,
      reviewState.override_value !== undefined ? reviewState.override_value : null
    );
    
    logger.debug('レビュー状態を保存しました', { company_id: reviewState.company_id });
  }
  
  /**
   * 企業のレビュー状態を取得
   */
  getReviewState(companyId: number): ReviewState | null {
    if (!this.db || !this.preparedStatements.selectReviewState) {
      throw new Error('データベースが初期化されていません');
    }
    
    return this.preparedStatements.selectReviewState.get(companyId) as ReviewState | null;
  }
  
  /**
   * すべてのレビュー状態を取得
   */
  getAllReviewStates(): any[] {
    if (!this.db || !this.preparedStatements.selectAllReviewStates) {
      throw new Error('データベースが初期化されていません');
    }
    
    return this.preparedStatements.selectAllReviewStates.all();
  }
  
  /**
   * レビュー状態を削除
   */
  deleteReviewState(companyId: number): void {
    if (!this.db || !this.preparedStatements.deleteReviewState) {
      throw new Error('データベースが初期化されていません');
    }
    
    this.preparedStatements.deleteReviewState.run(companyId);
    logger.debug('レビュー状態を削除しました', { company_id: companyId });
  }
  
  /**
   * 統計情報を取得
   */
  getStatistics(): { companies: number; evidence: number; successful: number; reviewed: number } {
    if (!this.db) throw new Error('データベースが初期化されていません');
    
    const companies = this.db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
    const evidence = this.db.prepare('SELECT COUNT(*) as count FROM evidence').get() as { count: number };
    const successful = this.db.prepare('SELECT COUNT(*) as count FROM evidence WHERE value IS NOT NULL').get() as { count: number };
    const reviewed = this.db.prepare('SELECT COUNT(*) as count FROM review_state').get() as { count: number };
    
    return {
      companies: companies.count,
      evidence: evidence.count,
      successful: successful.count,
      reviewed: reviewed.count,
    };
  }
}

export const db = new DatabaseManager();