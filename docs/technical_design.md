# 技術設計書
## 1. 技術スタック
- 言語: TypeScript (Node.js 22+)
- データベース: SQLite (better-sqlite3)
- スクレイピング: Playwright
- HTMLパース: cheerio
- LLM API:
  - OpenRouter（モデル例: meta-llama/llama-3.1-8b-instruct）
  - Ollama（モデル例: llama3.1:8b, qwen2:7b）
- 検索API（任意）: SerpApi
- 環境変数管理: dotenv

## 2. 環境変数
LLM_PROVIDER=openrouter|ollama
OPENROUTER_API_KEY=...
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
OLLAMA_MODEL=llama3.1:8b
SERPAPI_KEY=... # 任意

## 3. ディレクトリ構成

/src
index.ts # エントリーポイント
db.ts # SQLite操作
serp.ts # SerpApi検索
fetcher.ts # Playwright取得
extractor_regex.ts # 正規表現抽出
extractor_llm_openrouter.ts
extractor_llm_ollama.ts
utils.ts
companies.csv
.env


## 4. 処理フロー詳細
1. **企業名読み込み**
   - CSV→配列化
2. **URL収集**
   - SerpApi利用または事前指定URL
3. **HTML取得**
   - Playwrightで動的レンダリングも対応
4. **テキスト抽出**
   - bodyタグからinnerText取得
5. **正規表現抽出**
   - パターン例:
     - `/従業員数[:：\s]*([\d,]+)\s*名?/i`
     - `/Employees[:：\s]*([\d,]+)/i`
6. **LLM抽出**
   - OpenRouterまたはOllama APIにテキスト送信
   - STRICT JSONで返却
7. **保存**
   - DBスキーマ例（テーブル名を `extractions` に変更）:
     ```sql
     CREATE TABLE companies(
       id INTEGER PRIMARY KEY,
       name TEXT UNIQUE
     );
     CREATE TABLE extractions(
       id INTEGER PRIMARY KEY,
       company_id INTEGER,
       value INTEGER,
       raw_text TEXT,
       source_url TEXT,
       source_type TEXT,
       source_date TEXT,
       score REAL,
       model TEXT,
       extracted_at TEXT DEFAULT CURRENT_TIMESTAMP
     );
     ```
8. **出力確認**
   - SQLiteブラウザやCSVで確認

## 5. エラー処理
- タイムアウト時は次URLにフォールバック
- LLM出力JSONパース失敗時はnull扱い
- APIエラー時はスキップしてログ出力

## 6. コスト最適化設計
- regex成功時はLLMを呼ばない
- LLMは低コストモデルを優先
- 事前にテキストを短縮して送信トークン削減

## 7. 実行例
```bash
LLM_PROVIDER=openrouter OPENROUTER_API_KEY=sk-xxx npm run start
LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.1:8b npm run start
