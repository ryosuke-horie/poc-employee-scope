# poc-employee-scope

企業従業員数自動取得PoCの設計・仕様ドキュメントを管理するディレクトリです。

- 詳細な要件と設計は [docs/](docs) 以下にまとめています

## ワークフロー概要

```mermaid
flowchart LR
  A[企業・URL CSV\ncompanies.csv / urls.csv] --> B[CLI: ページ取得\nPlaywrightでHTML/テキスト化]
  B --> C[CLI: 従業員数抽出\n正規表現 → LLMフォールバック]
  C --> D[証跡保存\nDBへ: 値/根拠/URL/時刻]
  D --> E[エクスポート\nreview.json / CSV]
  E --> F[フロントエンド\nreview.jsonを読み込み]
  F --> G[レビュー\nOK/NG/不明・上書き値・メモ]
  G --> H[インポート\nreview.json → DB反映]
  H --> I[最終CSV出力\noverride優先で確定値]
```

## 実装状況（サマリ）

現在のCLI/フロントエンド実装の進捗をチェックリストで示します。

- [x] ページ取得（Playwright）とタイムアウト/並列制御
- [x] 正規表現による従業員数抽出（日本語/英語対応）
- [x] LLMフォールバック（OpenRouter）で補助抽出
- [x] 証跡保存（`page_title`/`status_code`/`fetched_at`/スニペット範囲）
- [x] エクスポート（`review.json`/CSV）と最小バンドル生成
- [x] レビュー結果の取り込み（import）と最終CSV出力（export --final）
- [x] URL正規化（CSV読込時の末尾スラッシュ/フラグメント除去）
- [ ] 404時の自動フォールバック（`.html/` → `.html` に再試行）
- [ ] `<link rel="canonical">` に基づく自動再取得
- [ ] `data/urls.csv` の静的検証（重複/priority/ドメイン）
- [ ] ドキュメント同期（README/ヘルプ/運用手順の完全整合）

## データの用意

- `data/companies.csv` と `data/urls.csv` を編集（サンプルあり）
- 例（正規化済みURLの例を推奨）:
  - `data/companies.csv`: `1,三菱UFJ銀行`
  - `data/urls.csv`: `1,https://www.bk.mufg.jp/kigyou/profile.html,official,1`

## 実行手順（上から順に実行）

注意: DBを削除すると、保存済みの証跡・レビュー状態は失われます。

```bash
# 1) DBを一度まっさらにして作り直す
npm run db:reinit

# 2) 収集と抽出を実行（CSV指定と並列数は適宜）
npm run start -- --companies data/companies.csv --urls data/urls.csv --parallel 3

# 3) レビュー用のバンドルを生成（review.json / CSV）
npm run export               # review.json を output/review/ に生成
npm run export -- --format csv

# 4) フロントエンドでレビュー（任意）
cd frontend && npm run dev  # http://localhost:4444 を開く

# 5) レビュー結果を取り込み、最終CSVを確定
cd ..
npm run start:extended -- import --review output/review/review.json
npm run start:extended -- export --final --output output/final.csv
```

## データソース（CSVとURL）

- `data/companies.csv`: 企業の基本リスト。
  - 列: `id,name`
  - 例: `1,三菱UFJ銀行`
- `data/urls.csv`: 企業ごとの候補URL（優先度順に処理）。
  - 列: `company_id,url,source_type,priority`
  - `source_type`: `official|wiki|ir|news|other`
  - `priority`: 数字が小さいほど優先（例: 1 が最優先）
  - 例: `1,https://www.bk.mufg.jp/kigyou/profile.html,official,1`
    - 備考: `.html/` のように末尾スラッシュが付いていると 404 になる場合があります（MUFG の会社概要ページは `.html` が正）。本リポジトリではCSV読込時にURL正規化（末尾スラッシュ/フラグメント除去）を実装済みです。

参考（公式一次情報の実在確認済み例）
- 三菱UFJ銀行 会社概要: `https://www.bk.mufg.jp/kigyou/profile.html`
  - ページ内に「従業員数 31,756名（2024年3月末現在、単体）」の記載を確認（2025-08-12取得）

## LLMの利用条件と役割

- 役割: 正規表現で従業員数を抽出できない、または低信頼な場合の補助。
- 起動条件:
  - 正規表現の候補が見つからない、または閾値未満の信頼度のときにフォールバック。
  - 入力は従業員数に関連するテキストへ事前フィルタし、最大長を制限（`MAX_TEXT_LENGTH_FOR_LLM`）。
- 送信内容: 抽出対象ページからのテキスト断片（スニペット）。機密情報やトークンは送信しない。
- モデル/接続: OpenRouter経由（モデルは `.env` の `OPENROUTER_MODEL_ID`）。
- タイムアウト/再試行: `REQUEST_TIMEOUT_MS` とリトライ設定に従う。失敗時はログに理由を記録。
- 出力の扱い: 数値をパースし、範囲チェック（1〜1,000万）。正規表現結果より低品質の場合は採用しない。
- ログ/証跡: 採用値・根拠スニペット・信頼度・抽出方法（regex|llm）を保存/出力。

<!-- ワークフローの詳細説明は上部「ワークフロー概要」と重複するため省略 -->

## CLI コマンド一覧

### データ収集（npm run start）
```bash
npm run start -- --help
```

主なオプション:
- `--companies <path>`: 企業リストCSVファイルのパス（デフォルト: `data/companies.csv`）
- `--urls <path>`: URLリストCSVファイルのパス（デフォルト: `data/urls.csv`）
- `--output <path>`: 結果出力先のパス（デフォルト: `output/results_[timestamp].csv`）
- `--parallel <num>`: 並列処理数（デフォルト: 3）

### エクスポート（npm run export）
```bash
npm run export -- --help
```

主なオプション:
- `--format <format>`: 出力形式 json|csv（デフォルト: json）
- `--output <path>`: 出力先ファイルパス

### データベース管理
```bash
npm run migrate      # テーブル作成
npm run db:reset     # データベース削除
npm run db:reinit    # 削除して再作成
```

## プロジェクト構成

```
poc-employee-scope/
├── src/                   # CLI ソースコード
│   ├── index.ts          # メインエントリーポイント
│   ├── cli-export.ts     # エクスポートコマンド
│   ├── export.ts         # エクスポート処理
│   ├── db.ts             # データベース操作
│   ├── fetcher.ts        # Playwright スクレイピング
│   ├── extractor_*.ts    # 抽出処理（正規表現/LLM）
│   └── types/            # 型定義
├── frontend/             # レビューUI（Next.js）
│   ├── app/              # App Router
│   ├── components/       # UIコンポーネント
│   ├── lib/              # ユーティリティ
│   └── public/           # 静的ファイル（review.json配置先）
├── data/                 # データファイル
│   ├── companies.csv     # 企業リスト
│   ├── urls.csv          # URLリスト  
│   └── companies.db      # SQLiteデータベース
├── output/               # 出力ディレクトリ
│   └── review/           # review.json出力先
└── docs/                 # ドキュメント

```

## 技術スタック

### バックエンド（CLI）
- **言語**: TypeScript (Node.js 22+)
- **データベース**: SQLite (better-sqlite3)
- **スクレイピング**: Playwright
- **HTMLパース**: cheerio
- **LLM連携**: OpenRouter API

### フロントエンド
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **状態管理**: React Context + useReducer
- **スキーマ検証**: AJV

## 環境変数

`.env`ファイルに以下を設定:

```bash
# 必須
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxx

# オプション（デフォルト値あり）
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
MAX_CONCURRENT_REQUESTS=3
REQUEST_TIMEOUT_MS=30000
MAX_TEXT_LENGTH_FOR_LLM=10000
```

## トラブルシューティング

### Playwrightのエラー
```bash
npx playwright install
```

### データベースのリセット
```bash
npm run db:reinit
```

### フロントエンドが表示されない
1. `npm run export`でreview.jsonを生成
2. ブラウザキャッシュをクリア
3. http://localhost:4444 にアクセス

## ライセンス

MIT
