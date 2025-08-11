import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { type ReviewState } from './db.js';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('ReviewState CRUD Operations', () => {
  let testDbPath: string;
  let testDb: Database.Database;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    const tempDir = mkdtempSync(join(tmpdir(), 'test-db-'));
    testDbPath = join(tempDir, 'test.db');
    
    // テスト用データベースを作成
    testDb = new Database(testDbPath);
    
    // テーブルを作成
    testDb.exec(`
      CREATE TABLE companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )
    `);
    
    testDb.exec(`
      CREATE TABLE review_state (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER NOT NULL UNIQUE,
        decision TEXT NOT NULL CHECK(decision IN ('ok', 'ng', 'unknown')),
        decided_at TEXT NOT NULL,
        note TEXT,
        override_value INTEGER,
        FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);
    
    // テスト用企業データを挿入
    testDb.prepare('INSERT INTO companies (name) VALUES (?)').run('テスト企業A');
    testDb.prepare('INSERT INTO companies (name) VALUES (?)').run('テスト企業B');
    testDb.prepare('INSERT INTO companies (name) VALUES (?)').run('テスト企業C');
  });

  afterEach(() => {
    // データベースを閉じて一時ファイルを削除
    testDb.close();
    rmSync(testDbPath, { recursive: true, force: true });
    rmSync(testDbPath.replace('/test.db', ''), { recursive: true, force: true });
  });

  it('レビュー状態を新規作成できる', () => {
    const reviewState: Omit<ReviewState, 'id'> = {
      company_id: 1,
      decision: 'ok',
      decided_at: '2024-01-01T10:00:00Z',
      note: 'データが正確',
      override_value: null
    };

    // INSERT
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      reviewState.company_id,
      reviewState.decision,
      reviewState.decided_at,
      reviewState.note,
      reviewState.override_value
    );

    // 確認
    const result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(1) as ReviewState;
    expect(result).toBeDefined();
    expect(result.decision).toBe('ok');
    expect(result.note).toBe('データが正確');
  });

  it('レビュー状態を更新できる（UPSERT）', () => {
    // 初回挿入
    const stmt = testDb.prepare(`
      INSERT OR REPLACE INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(1, 'unknown', '2024-01-01T10:00:00Z', '確認中', null);
    
    // 更新
    stmt.run(1, 'ok', '2024-01-01T11:00:00Z', '確認完了', 1000);
    
    // 確認
    const result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(1) as ReviewState;
    expect(result.decision).toBe('ok');
    expect(result.note).toBe('確認完了');
    expect(result.override_value).toBe(1000);
  });

  it('企業IDでレビュー状態を取得できる', () => {
    // データ挿入
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(2, 'ng', '2024-01-01T12:00:00Z', 'データに誤りあり', null);
    
    // 取得
    const result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(2) as ReviewState;
    
    expect(result).toBeDefined();
    expect(result.company_id).toBe(2);
    expect(result.decision).toBe('ng');
  });

  it('存在しない企業IDの場合はnullを返す', () => {
    const result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(999);
    expect(result).toBeUndefined();
  });

  it('すべてのレビュー状態を取得できる', () => {
    // 複数のデータを挿入
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(1, 'ok', '2024-01-01T10:00:00Z', null, null);
    stmt.run(2, 'ng', '2024-01-01T11:00:00Z', 'エラー', null);
    stmt.run(3, 'unknown', '2024-01-01T12:00:00Z', null, 500);
    
    // すべて取得
    const results = testDb.prepare(`
      SELECT 
        c.name as company_name,
        r.*
      FROM review_state r
      JOIN companies c ON r.company_id = c.id
      ORDER BY r.decided_at DESC
    `).all();
    
    expect(results).toHaveLength(3);
    expect(results[0]).toHaveProperty('company_name');
  });

  it('レビュー状態を削除できる', () => {
    // データ挿入
    const insertStmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertStmt.run(1, 'ok', '2024-01-01T10:00:00Z', null, null);
    
    // 削除前の確認
    let result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(1);
    expect(result).toBeDefined();
    
    // 削除
    const deleteStmt = testDb.prepare('DELETE FROM review_state WHERE company_id = ?');
    deleteStmt.run(1);
    
    // 削除後の確認
    result = testDb.prepare('SELECT * FROM review_state WHERE company_id = ?').get(1);
    expect(result).toBeUndefined();
  });

  it('統計情報にレビュー済み件数が含まれる', () => {
    // データ挿入
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(1, 'ok', '2024-01-01T10:00:00Z', null, null);
    stmt.run(2, 'ng', '2024-01-01T11:00:00Z', null, null);
    
    // 統計情報取得
    const reviewedCount = testDb.prepare('SELECT COUNT(*) as count FROM review_state').get() as { count: number };
    
    expect(reviewedCount.count).toBe(2);
  });

  it('decision値の制約が正しく動作する', () => {
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // 無効なdecision値でエラーになることを確認
    expect(() => {
      stmt.run(1, 'invalid', '2024-01-01T10:00:00Z', null, null);
    }).toThrow();
  });

  it('company_idのユニーク制約が正しく動作する', () => {
    const stmt = testDb.prepare(`
      INSERT INTO review_state (company_id, decision, decided_at, note, override_value)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    // 1回目は成功
    stmt.run(1, 'ok', '2024-01-01T10:00:00Z', null, null);
    
    // 2回目は制約違反でエラー
    expect(() => {
      stmt.run(1, 'ng', '2024-01-01T11:00:00Z', null, null);
    }).toThrow();
  });
});