import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Extended DB Evidence', () => {
  let tempDir: string;
  let db: any;
  
  beforeEach(async () => {
    // モジュールをリセット
    vi.resetModules();
    
    // 一時ディレクトリを作成
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-db-'));
    process.env.DB_PATH = path.join(tempDir, 'test.db');
    process.env.OPENROUTER_API_KEY = 'test-key';
    
    // DBモジュールを再インポート
    const dbModule = await import('../src/db.js');
    db = dbModule.db;
    
    // DBを初期化
    await db.initialize();
  });
  
  afterEach(() => {
    // DBを閉じる
    db.close();
    
    // 一時ディレクトリを削除
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });
  
  it('拡張フィールドを保存できる', () => {
    const company = db.upsertCompany('テスト企業');
    
    db.insertEvidence({
      company_id: company.id!,
      value: 1000,
      raw_text: '従業員数: 1000人',
      source_url: 'https://example.com',
      source_type: 'web',
      source_date: '2024-01-01',
      score: 0.95,
      model: 'regex',
      page_title: 'テスト企業 - 会社概要',
      status_code: 200,
      fetched_at: '2024-01-01T10:00:00Z',
      snippet_start: 100,
      snippet_end: 200,
    });
    
    const evidence = db.getEvidenceByCompany(company.id!);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].page_title).toBe('テスト企業 - 会社概要');
    expect(evidence[0].status_code).toBe(200);
    expect(evidence[0].fetched_at).toBe('2024-01-01T10:00:00Z');
    expect(evidence[0].snippet_start).toBe(100);
    expect(evidence[0].snippet_end).toBe(200);
  });
  
  it('エラー時もエラーサマリーを保存できる', () => {
    const company = db.upsertCompany('失敗企業');
    
    db.insertEvidence({
      company_id: company.id!,
      value: null,
      raw_text: '',
      source_url: 'https://error.example.com',
      source_type: 'web',
      source_date: '2024-01-01',
      score: 0,
      model: 'none',
      error_summary: 'ページ取得失敗: 404 Not Found',
      status_code: 404,
      fetched_at: '2024-01-01T10:00:00Z',
    });
    
    const evidence = db.getEvidenceByCompany(company.id!);
    expect(evidence).toHaveLength(1);
    expect(evidence[0].value).toBeNull();
    expect(evidence[0].error_summary).toBe('ページ取得失敗: 404 Not Found');
    expect(evidence[0].status_code).toBe(404);
  });
  
  it('getAllEvidenceで新フィールドを含む', () => {
    const company = db.upsertCompany('テスト企業2');
    
    db.insertEvidence({
      company_id: company.id!,
      value: 500,
      raw_text: 'スタッフ数: 500名',
      source_url: 'https://example2.com',
      source_type: 'web',
      source_date: '2024-01-01',
      score: 0.85,
      model: 'regex',
      page_title: '企業情報',
      status_code: 200,
      fetched_at: '2024-01-01T11:00:00Z',
      snippet_start: 50,
      snippet_end: 150,
    });
    
    const allEvidence = db.getAllEvidence();
    expect(allEvidence).toHaveLength(1);
    expect(allEvidence[0].company_name).toBe('テスト企業2');
    expect(allEvidence[0].page_title).toBe('企業情報');
    expect(allEvidence[0].status_code).toBe(200);
    expect(allEvidence[0].snippet_start).toBe(50);
    expect(allEvidence[0].snippet_end).toBe(150);
  });
});