# poc-employee-scope

企業従業員数自動取得PoCの設計・仕様ドキュメントを管理するリポジトリです。

 - 新規参加者は [docs/manual/onboarding.md](docs/manual/onboarding.md) を参照してください
 - 詳細な要件と設計は [docs/](docs) 以下にまとめています

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

## 使い方（エンドツーエンド）

目的: DBを初期化 → データ取得 → レビュー用バンドル生成 → フロントエンドでレビュー → 最終CSV出力までの最短手順。

前提
- Node.js 22 以上
- OpenRouter API キー（取得: https://openrouter.ai/keys）
- ブラウザ（最新 Chrome）

セットアップ（初回のみ）
```bash
# 1) 依存関係のインストール（ルート）
npm install

# 2) .env を作成し API キーを設定
cp .env.example .env
${EDITOR:-vi} .env   # OPENROUTER_API_KEY を設定

# 3) Playwright のブラウザ依存をインストール（失敗時の定番対処）
npx playwright install

# 4) データベース初期化（テーブル作成）
npm run migrate
```

データベースのリセット（再初期化したい場合）
```bash
# 既存の DB ファイルを削除して、空の状態から再作成
npm run db:reinit    # = rimraf data/companies.db && npm run migrate

# もしくは手動で:
# rm data/companies.db && npm run migrate
```
注意: DBを削除すると、保存済みの証跡・レビュー状態は失われます。

データの用意（サンプル同梱、任意で編集）
- `data/companies.csv` と `data/urls.csv` を確認・編集（初期サンプルあり）

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

データ取得（スクレイピング＋抽出）
```bash
# デフォルト設定で実行（data/companies.csv と data/urls.csv を使用）
npm run start

# CSV を指定し、並列数（例: 5）で取得
npm run start -- --companies data/companies.csv --urls data/urls.csv --parallel 5

# ヘルプ（オプション一覧）
npm run start -- --help
```

レビュー用バンドルの生成（review.json）
```bash
# review.json を生成（自動で frontend/public/review.json へコピー）
npm run export

# CSVフォーマットでエクスポート
npm run export -- --format csv

# カスタムパスに出力
npm run export -- --output custom/path/review.json
```

フロントエンドでレビュー（ローカル UI）
```bash
cd frontend
npm install
npm run dev   # http://localhost:4444 を開く（ポート固定）
```
- 一覧/詳細を確認し、OK/NG/不明・上書き値・メモを入力
- 画面上部の「保存」でブラウザの `localStorage` に保存（自動保存なし）
- AJV によるスキーマ検証は読込/保存前に実行（エラーバナー表示）
- フィルタ機能：状態（OK/NG/不明）、スコア範囲、ソースタイプで絞り込み可能

最終CSVの出力（現在未実装）
```bash
# 将来実装予定：レビュー結果を反映したCSVエクスポート
# npm run export -- --format csv --include-review
```
注意
- 現行バージョンではフロントエンドは `localStorage` 保存のみ
- レビュー結果の取り込み機能（import）は今後実装予定
- 差分表示機能は基本実装済みだが、現在は無効化中

## ワークフロー（CLI抽出 → 人手レビュー）

全体像をエンジニア以外にも伝わる形で図示します（Mermaid）。

```mermaid
flowchart LR
  A[企業・URL CSV
  companies.csv / urls.csv] --> B[CLI: ページ取得
  PlaywrightでHTML/テキスト化]
  B --> C[CLI: 従業員数抽出
  正規表現 → LLMフォールバック]
  C --> D[証跡保存
  DBへ: 値/根拠/URL/時刻]
  D --> E[エクスポート
  review.json / CSV]
  E --> F[フロントエンド
  review.jsonを読み込み]
  F --> G[人手レビュー
  OK/NG/不明・上書き値・メモ]
  G --> H[インポート
  review.json → DB反映]
  H --> I[最終CSV出力
  override優先で確定値]
```

ポイント
- まずCLIがURL候補を優先度順に取得し、テキストから自動抽出します。
- 抽出の信頼度や根拠（スニペット）を証跡として保存・出力します。
- フロントエンドで人が確認・判断し、必要に応じて上書き値を入力します。
- 最終的にレビュー結果を取り込み、最終CSVを確定出力します。

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
