# poc-employee-scope

企業従業員数自動取得PoCの設計・仕様ドキュメントを管理するリポジトリです。

 - 新規参加者は [docs/manual/onboarding.md](docs/manual/onboarding.md) を参照してください
 - 詳細な要件と設計は [docs/](docs) 以下にまとめています

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

データの用意（サンプル同梱、任意で編集）
- `data/companies.csv` と `data/urls.csv` を確認・編集（初期サンプルあり）

データ取得（スクレイピング＋抽出）
```bash
# CSV を指定し、並列数（例: 3）で取得
npm run start -- extract --companies data/companies.csv --urls data/urls.csv --parallel 3

# ヘルプ（オプション一覧）
npm run start -- help
```

レビュー用バンドルの生成（review.json + 最小 index.html）
```bash
# 出力先（例: output/）配下に output/review/review.json 等を生成
npm run start -- bundle --output output/

# frontend/ が存在する場合、review.json を自動で frontend/public/review.json へコピー
# （環境変数 COPY_TO_FRONTEND=false でコピー抑止）
```

フロントエンドでレビュー（ローカル UI）
```bash
cd frontend
npm install
npm run dev   # http://localhost:4444 を開く
```
- 一覧/詳細を確認し、OK/NG/不明・上書き値・メモを入力
- 画面上部の「保存」でブラウザの `localStorage` に保存（自動保存なし）
- AJV によるスキーマ検証は読込/保存前に実行（エラーバナー表示）

最終CSVの出力（レビューを反映）
```bash
# 方式A: レビューJSONを DB へ取り込み → 最終CSV
npm run start -- import --review output/review/review.json
npm run start -- export --final --output output/final.csv

# 方式B: レビューJSONを直接参照して最終CSV（レビューJSONに最新の review_state が含まれる場合）
npm run start -- export --final --review output/review/review.json --output output/final.csv
```
注意
- 現行の最小フェーズではフロントエンドは `localStorage` 保存のみ（ダウンロード/インポートUIは未実装）。
- 最終CSVにレビュー結果を反映するには、上記「方式A/B」のいずれかで `review_state` を CLI に渡してください。
  - 暫定運用: `localStorage` の `review_state_v1` をエクスポートし、`review.json` の `review_state` に整形して `import` する（将来はUI側でエクスポート対応予定）。

## CLI

ヘルプは次のコマンドで表示できます:

```bash
OPENROUTER_API_KEY=dummy npm run start -- --help
```

### 主なオプション

- `--companies <path>`: 企業リストCSVファイルのパス（デフォルト: `data/companies.csv`）
- `--urls <path>`: URLリストCSVファイルのパス（デフォルト: `data/urls.csv`）
- `--output <path>`: 結果出力先のパス（デフォルト: `output/results_[timestamp].csv`）
- `--parallel <num>`: 並列処理数（デフォルト: 3）

詳細は [docs/cli-commands.md](docs/cli-commands.md) を参照してください
