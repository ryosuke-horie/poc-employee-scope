import { promises as fs } from 'fs';
import { join } from 'path';
import { stringify } from 'csv-stringify/sync';
import { logger } from './logger.js';
import { db } from './db.js';
import { ensureDirectory } from './utils.js';

/**
 * CSVエクスポート用のインターフェース
 */
export interface CSVExportRow {
  company_name: string;
  employee_count: number | null;
  source_url: string;
  source_text: string;
  extraction_method: string;
  confidence_score: number;
  extracted_at: string;
  page_title: string | null;
  status_code: number | null;
  error_message: string | null;
}

/**
 * Review.json用のインターフェース（スキーマ準拠）
 */
export interface ReviewBundle {
  generated_at: string;
  companies: Array<{
    id: number;
    name: string;
  }>;
  evidence: Array<{
    company_id: number;
    value: number | null;
    raw_text: string;
    source_url: string;
    source_type: 'official' | 'ir' | 'pdf' | 'gov' | 'wiki' | 'news' | 'agg' | 'web' | 'api' | 'manual';
    page_title?: string | null;
    status_code?: number | null;
    score?: number | null;
    model?: string | null;
    snippet_start?: number | null;
    snippet_end?: number | null;
    extracted_at: string;
  }>;
  review_state: Array<{
    company_id: number;
    decision: 'ok' | 'ng' | 'unknown';
    override_value?: number | null;
    note?: string | null;
    decided_at?: string | null;
  }>;
}

/**
 * データベースから全証跡を取得してCSV形式にエクスポート
 */
export async function exportToCSV(outputPath: string): Promise<void> {
  try {
    // 証跡を取得
    const allEvidence = db.getAllEvidence();
    
    // CSV形式に変換
    const rows: CSVExportRow[] = allEvidence.map(evidence => ({
      company_name: evidence.company_name,
      employee_count: evidence.value,
      source_url: evidence.source_url,
      source_text: evidence.raw_text,
      extraction_method: evidence.model === 'regex' ? 'regex' : 
                         evidence.model === 'none' ? 'failed' : 'llm',
      confidence_score: evidence.score || 0,
      extracted_at: evidence.extracted_at,
      page_title: evidence.page_title || null,
      status_code: evidence.status_code || null,
      error_message: evidence.error_summary || null,
    }));
    
    // CSV列定義（固定）
    const columns = [
      'company_name',
      'employee_count', 
      'source_url',
      'source_text',
      'extraction_method',
      'confidence_score',
      'extracted_at',
      'page_title',
      'status_code',
      'error_message',
    ];
    
    const csvContent = stringify(rows, {
      header: true,
      columns,
    });
    
    // ディレクトリを作成
    await ensureDirectory(join(outputPath, '..'));
    
    // ファイルに書き込み
    await fs.writeFile(outputPath, csvContent, 'utf-8');
    logger.info(`CSVをエクスポートしました: ${outputPath}`);
    logger.info(`エクスポート件数: ${rows.length}件`);
    
  } catch (error) {
    logger.error('CSVエクスポートエラー', error);
    throw error;
  }
}

/**
 * データベースから全データを取得してJSON形式にエクスポート（review.schema.json準拠）
 */
export async function exportToJSON(outputPath: string): Promise<void> {
  try {
    // 企業リストを取得
    const dbInstance = db.getDb();
    if (!dbInstance) throw new Error('データベースが初期化されていません');
    
    const companiesQuery = dbInstance.prepare('SELECT * FROM companies ORDER BY id');
    const companies = companiesQuery.all() as Array<{ id: number; name: string }>;
    
    // 証跡を取得
    const evidenceQuery = dbInstance.prepare(`
      SELECT * FROM evidence 
      ORDER BY company_id, extracted_at DESC
    `);
    const allEvidence = evidenceQuery.all();
    
    // source_typeをマッピング
    const mapSourceType = (type: string): ReviewBundle['evidence'][0]['source_type'] => {
      const typeMap: Record<string, ReviewBundle['evidence'][0]['source_type']> = {
        'web': 'web',
        'api': 'api',
        'manual': 'manual',
      };
      return typeMap[type] || 'web';
    };
    
    // ReviewBundle形式に変換
    const reviewBundle: ReviewBundle = {
      generated_at: new Date().toISOString(),
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
      })),
      evidence: allEvidence.map((e: any) => ({
        company_id: e.company_id,
        value: e.value,
        raw_text: e.raw_text || '',
        source_url: e.source_url || '',
        source_type: mapSourceType(e.source_type),
        page_title: e.page_title || null,
        status_code: e.status_code || null,
        score: e.score || null,
        model: e.model || null,
        snippet_start: e.snippet_start || null,
        snippet_end: e.snippet_end || null,
        extracted_at: e.extracted_at || new Date().toISOString(),
      })),
      review_state: companies.map(c => ({
        company_id: c.id,
        decision: 'unknown' as const,
        override_value: null,
        note: null,
        decided_at: null,
      })),
    };
    
    // ディレクトリを作成
    await ensureDirectory(join(outputPath, '..'));
    
    // JSONファイルに書き込み
    await fs.writeFile(outputPath, JSON.stringify(reviewBundle, null, 2), 'utf-8');
    logger.info(`JSONをエクスポートしました: ${outputPath}`);
    logger.info(`企業数: ${companies.length}件、証跡数: ${allEvidence.length}件`);
    
  } catch (error) {
    logger.error('JSONエクスポートエラー', error);
    throw error;
  }
}

/**
 * バンドルコマンド: review.jsonと最小UIシェルを生成
 */
export async function createReviewBundle(outputDir: string): Promise<void> {
  try {
    const reviewDir = join(outputDir, 'review');
    await ensureDirectory(reviewDir);
    
    // review.jsonを生成
    const jsonPath = join(reviewDir, 'review.json');
    await exportToJSON(jsonPath);
    
    // 最小UIシェル（index.html）を生成
    const htmlContent = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>従業員数レビュー</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }
    .info {
      background: #f0f8ff;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .info p {
      margin: 5px 0;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .download-btn {
      display: inline-block;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin-top: 10px;
    }
    .download-btn:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>従業員数抽出結果レビュー</h1>
    
    <div class="info">
      <h2>📋 レビューデータ</h2>
      <p>生成日時: <span id="generated-at">-</span></p>
      <p>企業数: <span id="company-count">-</span>社</p>
      <p>証跡数: <span id="evidence-count">-</span>件</p>
      <a href="review.json" class="download-btn" download>review.json をダウンロード</a>
    </div>
    
    <div class="info">
      <h2>🚀 Next.jsフロントエンドの使用方法</h2>
      <ol>
        <li>Next.jsフロントエンドが <code>frontend/</code> ディレクトリにある場合</li>
        <li><code>review.json</code> を <code>frontend/public/</code> にコピー</li>
        <li><code>cd frontend && npm run dev</code> でフロントエンドを起動</li>
        <li>ブラウザで <a href="http://localhost:3000">http://localhost:3000</a> を開く</li>
      </ol>
    </div>
    
    <div class="info">
      <h2>📝 データ構造</h2>
      <pre id="data-structure">読み込み中...</pre>
    </div>
  </div>
  
  <script>
    // review.jsonを読み込んで情報を表示
    fetch('review.json')
      .then(response => response.json())
      .then(data => {
        document.getElementById('generated-at').textContent = 
          new Date(data.generated_at).toLocaleString('ja-JP');
        document.getElementById('company-count').textContent = data.companies.length;
        document.getElementById('evidence-count').textContent = data.evidence.length;
        
        // データ構造のサンプルを表示
        const sample = {
          generated_at: data.generated_at,
          companies: data.companies.slice(0, 2).concat(
            data.companies.length > 2 ? ['...'] : []
          ),
          evidence: data.evidence.slice(0, 2).concat(
            data.evidence.length > 2 ? ['...'] : []
          ),
          review_state: data.review_state.slice(0, 2).concat(
            data.review_state.length > 2 ? ['...'] : []
          ),
        };
        document.getElementById('data-structure').textContent = 
          JSON.stringify(sample, null, 2);
      })
      .catch(error => {
        console.error('Error loading review.json:', error);
        document.getElementById('data-structure').textContent = 
          'エラー: review.jsonの読み込みに失敗しました';
      });
  </script>
</body>
</html>`;
    
    const htmlPath = join(reviewDir, 'index.html');
    await fs.writeFile(htmlPath, htmlContent, 'utf-8');
    
    logger.info(`レビューバンドルを作成しました: ${reviewDir}`);
    logger.info(`  - review.json: レビュー用データ`);
    logger.info(`  - index.html: 最小UIシェル`);
    
    // frontend連携オプション（frontendディレクトリが存在する場合）
    const frontendDir = join(process.cwd(), 'frontend', 'public');
    try {
      await fs.access(frontendDir);
      const copyToFrontend = process.env.COPY_TO_FRONTEND !== 'false';
      
      if (copyToFrontend) {
        const frontendJsonPath = join(frontendDir, 'review.json');
        await fs.copyFile(jsonPath, frontendJsonPath);
        logger.info(`frontend連携: review.jsonを ${frontendJsonPath} にコピーしました`);
      }
    } catch {
      // frontendディレクトリが存在しない場合は無視
    }
    
  } catch (error) {
    logger.error('レビューバンドル作成エラー', error);
    throw error;
  }
}

/**
 * 最終CSVエクスポート（レビュー結果反映後）
 */
export async function exportFinalCSV(outputPath: string, reviewJsonPath?: string): Promise<void> {
  try {
    // レビュー結果を読み込み（あれば）
    let reviewData: ReviewBundle | null = null;
    if (reviewJsonPath) {
      try {
        const jsonContent = await fs.readFile(reviewJsonPath, 'utf-8');
        reviewData = JSON.parse(jsonContent);
        logger.info(`レビュー結果を読み込みました: ${reviewJsonPath}`);
      } catch (error) {
        logger.warn(`レビュー結果の読み込みに失敗: ${reviewJsonPath}`, error);
      }
    }
    
    // 企業リストを取得
    const dbInstance = db.getDb();
    if (!dbInstance) throw new Error('データベースが初期化されていません');
    
    const companiesQuery = dbInstance.prepare('SELECT * FROM companies ORDER BY id');
    const companies = companiesQuery.all() as Array<{ id: number; name: string }>;
    
    // 各企業の最終値を決定
    const finalRows = companies.map(company => {
      // 証跡から最良の値を取得
      const evidence = db.getEvidenceByCompany(company.id);
      const bestEvidence = evidence
        .filter(e => e.value !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      // レビュー結果があれば優先
      let finalValue = bestEvidence?.value || null;
      let decision = 'unknown';
      let note = '';
      
      if (reviewData) {
        const reviewState = reviewData.review_state.find(
          r => r.company_id === company.id
        );
        if (reviewState) {
          decision = reviewState.decision;
          note = reviewState.note || '';
          if (reviewState.override_value !== null && reviewState.override_value !== undefined) {
            finalValue = reviewState.override_value;
          }
        }
      }
      
      return {
        company_name: company.name,
        employee_count: finalValue,
        decision,
        note,
        source_url: bestEvidence?.source_url || '',
        confidence_score: bestEvidence?.score || 0,
        extraction_method: bestEvidence?.model || 'none',
        extracted_at: bestEvidence?.extracted_at || '',
      };
    });
    
    // CSV出力
    const csvContent = stringify(finalRows, {
      header: true,
      columns: [
        'company_name',
        'employee_count',
        'decision',
        'note',
        'source_url',
        'confidence_score',
        'extraction_method',
        'extracted_at',
      ],
    });
    
    await ensureDirectory(join(outputPath, '..'));
    await fs.writeFile(outputPath, csvContent, 'utf-8');
    
    logger.info(`最終CSVをエクスポートしました: ${outputPath}`);
    logger.info(`エクスポート件数: ${finalRows.length}件`);
    
  } catch (error) {
    logger.error('最終CSVエクスポートエラー', error);
    throw error;
  }
}