import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadCompaniesWithUrls } from '../src/csv_loader.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('loadCompaniesWithUrls', () => {
  let tempDir: string;
  let companiesPath: string;
  let urlsPath: string;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(join(tmpdir(), 'test-csv-'));
    companiesPath = join(tempDir, 'companies.csv');
    urlsPath = join(tempDir, 'urls.csv');
  });

  afterEach(async () => {
    // 一時ディレクトリをクリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('正常系', () => {
    it('企業とURLを正しく読み込める', async () => {
      // テストデータを作成
      await fs.writeFile(companiesPath, 
        'id,name\n' +
        '1,株式会社テストA\n' +
        '2,株式会社テストB\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://test-a.com,official,1\n' +
        '1,https://test-a.com/about,official,2\n' +
        '2,https://test-b.com,official,1\n'
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);

      expect(result).toHaveLength(2);
      expect(result[0].company.id).toBe(1);
      expect(result[0].company.name).toBe('株式会社テストA');
      expect(result[0].urls).toHaveLength(2);
      expect(result[0].urls[0].url).toBe('https://test-a.com');
      expect(result[0].urls[0].priority).toBe(1);
      
      expect(result[1].company.id).toBe(2);
      expect(result[1].company.name).toBe('株式会社テストB');
      expect(result[1].urls).toHaveLength(1);
    });

    it('URLがない企業も読み込める', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n' +
        '1,株式会社テストA\n' +
        '2,株式会社テストB\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://test-a.com,official,1\n'
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);

      expect(result).toHaveLength(2);
      expect(result[0].urls).toHaveLength(1);
      expect(result[1].urls).toHaveLength(0);
    });

    it('優先度順にURLがソートされる', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n1,テスト株式会社\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://test.com/3,news,7\n' +
        '1,https://test.com/1,official,1\n' +
        '1,https://test.com/2,wiki,5\n'
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);

      expect(result[0].urls[0].priority).toBe(1);
      expect(result[0].urls[1].priority).toBe(5);
      expect(result[0].urls[2].priority).toBe(7);
    });
  });

  describe('バリデーション', () => {
    it('必須ヘッダーがない場合エラー', async () => {
      await fs.writeFile(companiesPath,
        'name\n株式会社テスト\n' // idカラムがない
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n'
      );

      await expect(loadCompaniesWithUrls(companiesPath, urlsPath))
        .rejects.toThrow();
    });

    it('無効なcompany_idの場合警告', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n1,株式会社テスト\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://test.com,official,1\n' +
        '999,https://invalid.com,official,1\n' // 存在しないcompany_id
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);
      
      // 無効なURLは無視される
      expect(result[0].urls).toHaveLength(1);
    });

    it('不正な優先度は99に設定される', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n1,株式会社テスト\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://test.com,official,invalid\n' // 不正な優先度
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);
      
      expect(result[0].urls[0].priority).toBe(99);
    });
  });

  describe('エンコーディング', () => {
    it('UTF-8の日本語を正しく読み込める', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n1,株式会社テスト企業🏢\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n' +
        '1,https://テスト.com,official,1\n'
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);
      
      expect(result[0].company.name).toBe('株式会社テスト企業🏢');
      expect(result[0].urls[0].url).toBe('https://テスト.com');
    });

    it('空のCSVファイルを処理できる', async () => {
      await fs.writeFile(companiesPath,
        'id,name\n'
      );
      
      await fs.writeFile(urlsPath,
        'company_id,url,source_type,priority\n'
      );

      const result = await loadCompaniesWithUrls(companiesPath, urlsPath);
      
      expect(result).toHaveLength(0);
    });
  });
});