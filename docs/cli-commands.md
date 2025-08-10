# CLIコマンドリファレンス

## 概要

本システムは企業の従業員数を自動取得するPoCツールです。Webスクレイピング（Playwright）と正規表現/LLM（OpenRouter）を組み合わせて従業員数を抽出し、人手確認のための証跡を保存します。

## 前提条件

- Node.js 22以上
- OpenRouter APIキー（https://openrouter.ai/keys で取得）
- `.env`ファイルに`OPENROUTER_API_KEY`を設定

## コマンド一覧

### 1. start - 従業員数抽出

企業リストとURLリストから従業員数を自動抽出します。

```bash
# 基本使用法
npm run start

# オプション指定
npm run start -- --companies data/companies.csv --urls data/urls.csv --parallel 5
```

**オプション:**
- `--companies <path>`: 企業リストCSVファイルのパス（デフォルト: `data/companies.csv`）
- `--urls <path>`: URLリストCSVファイルのパス（デフォルト: `data/urls.csv`）
- `--output <path>`: 結果出力先のパス（デフォルト: `output/results_[timestamp].csv`）
- `--parallel <num>`: 並列処理数（デフォルト: 3）

**入力ファイル形式:**

`companies.csv`:
```csv
id,name
1,株式会社サンプル
2,テスト商事
```

`urls.csv`:
```csv
company_id,url,source_type,priority
1,https://example.com/about,official,1
1,https://example.com/ir,ir,2
2,https://test.co.jp,official,1
```

### 2. export - 結果エクスポート

データベースから抽出結果をエクスポートします。

```bash
# CSV形式でエクスポート
npm run poc export -- --format csv

# JSON形式でエクスポート（review.schema.json準拠）
npm run poc export -- --format json --output output/review.json

# レビュー済み最終結果をCSVで出力
npm run poc export -- --final --review output/review/review.json
```

**オプション:**
- `--format <type>`: 出力形式 `csv` | `json`（デフォルト: `csv`）
- `--output <path>`: 出力先パス（デフォルト: `output/export.[csv|json]`）
- `--final`: レビュー済み最終結果を出力
- `--review <path>`: レビュー結果JSONのパス（`--final`時に使用）

**CSV出力列（固定）:**
- `company_name`: 企業名
- `employee_count`: 従業員数
- `source_url`: 情報源URL
- `source_text`: 抽出箇所のテキスト
- `extraction_method`: 抽出方法（regex/llm/failed）
- `confidence_score`: 信頼度スコア（0-1）
- `extracted_at`: 抽出日時
- `page_title`: ページタイトル
- `status_code`: HTTPステータスコード
- `error_message`: エラーメッセージ（失敗時）

### 3. bundle - レビューバンドル作成

人手レビュー用のバンドル（review.json + index.html）を作成します。

```bash
# レビューバンドルを作成
npm run poc bundle

# 出力先を指定
npm run poc bundle -- --output output/
```

**オプション:**
- `--output <path>`: 出力ディレクトリ（デフォルト: `output/`）

**生成ファイル:**
- `output/review/review.json`: レビュー用データ（review.schema.json準拠）
- `output/review/index.html`: 最小UIシェル（ブラウザで確認用）

**Frontend連携:**
- `COPY_TO_FRONTEND=true`（環境変数）を設定すると、`frontend/public/review.json`に自動コピー

### 4. import - レビュー結果インポート（未実装）

人手レビュー結果をデータベースに反映します。

```bash
# レビュー結果をインポート
npm run poc import -- --review output/review/review.json
```

**オプション:**
- `--review <path>`: インポートするレビュー結果JSONのパス（必須）

※ このコマンドは次のフェーズで実装予定です。

## 環境変数

`.env`ファイルで設定可能な環境変数：

### 必須
- `OPENROUTER_API_KEY`: OpenRouterのAPIキー

### 実行設定
- `MAX_CONCURRENT_REQUESTS`: 最大並列リクエスト数（デフォルト: 3）
- `REQUEST_TIMEOUT_MS`: リクエストタイムアウト（デフォルト: 30000）
- `RETRY_COUNT`: リトライ回数（デフォルト: 3）

### Playwright設定
- `USER_AGENT`: ユーザーエージェント
- `NAV_WAIT_MS`: ページ遷移後の待機時間（デフォルト: 2000）

### 抽出設定
- `SNIPPET_CONTEXT_CHARS`: 抽出スニペットの前後文字数（デフォルト: 200）
- `PREFER_REGEX_OVER_LLM`: 正規表現を優先（デフォルト: true）
- `MAX_TEXT_LENGTH_FOR_LLM`: LLMに送信する最大文字数（デフォルト: 10000）

### その他
- `DB_PATH`: データベースファイルのパス（デフォルト: `./data/companies.db`）
- `OUTPUT_DIR`: 出力ディレクトリ（デフォルト: `./output`）
- `LOG_LEVEL`: ログレベル（debug/info/warn/error、デフォルト: info）
- `COPY_TO_FRONTEND`: bundleコマンド時にfrontendへコピー（デフォルト: true）

## 使用例

### 基本的なワークフロー

1. **データ準備**
```bash
# companies.csvとurls.csvを準備
ls data/
# companies.csv  urls.csv
```

2. **従業員数抽出**
```bash
npm run poc extract
# または
npm run poc
```

3. **結果確認とエクスポート**
```bash
# CSV形式で確認
npm run poc export -- --format csv --output output/results.csv

# レビュー用バンドル作成
npm run poc bundle
```

4. **レビュー実施**
```bash
# ブラウザでレビュー用UIを開く
open output/review/index.html

# またはNext.jsフロントエンドを使用
cd frontend && npm run dev
```

5. **最終結果出力**
```bash
# レビュー結果を反映した最終CSV
npm run poc export -- --final --review output/review/review.json --output output/final.csv
```

### 高速処理（並列数を増やす）

```bash
# 10並列で処理（API制限に注意）
npm run poc extract -- --parallel 10
```

### カスタムファイルパス

```bash
# 独自のデータファイルを使用
npm run poc extract -- \
  --companies custom/my_companies.csv \
  --urls custom/my_urls.csv \
  --output custom/results.csv
```

## トラブルシューティング

### OpenRouter APIキーエラー
```
エラー: 環境変数 OPENROUTER_API_KEY が設定されていません
```
→ `.env`ファイルにAPIキーを設定してください

### タイムアウトエラー
```
エラー: ページ取得失敗: タイムアウト
```
→ `REQUEST_TIMEOUT_MS`と`NAV_WAIT_MS`を増やしてください

### メモリ不足
```
FATAL ERROR: Reached heap limit
```
→ 並列数を減らすか、Node.jsのメモリ制限を増やしてください：
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run poc
```

## データフォーマット

### review.json形式

`docs/schemas/review.schema.json`に準拠した形式：

```json
{
  "generated_at": "2024-01-01T00:00:00Z",
  "companies": [
    {"id": 1, "name": "株式会社サンプル"}
  ],
  "evidence": [
    {
      "company_id": 1,
      "value": 1000,
      "raw_text": "従業員数: 1000名",
      "source_url": "https://example.com",
      "source_type": "official",
      "page_title": "会社概要",
      "status_code": 200,
      "score": 0.95,
      "model": "regex",
      "snippet_start": 100,
      "snippet_end": 200,
      "extracted_at": "2024-01-01T00:00:00Z"
    }
  ],
  "review_state": [
    {
      "company_id": 1,
      "decision": "ok",
      "override_value": null,
      "note": "正確",
      "decided_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## 関連ドキュメント

- [セットアップ手順](./manual/setup.md)
- [データ準備ガイド](./manual/data_prep.md)
- [ソースガイドライン](./manual/source_guidelines.md)
- [レビューワークフロー](./manual/review_workflow.md)
- [スキーマ定義](./schemas/review.schema.json)