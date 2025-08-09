# 新規参加者のオンボーディング

## リポジトリの全体構造
- 仕様と設計を中心に管理するリポジトリで、トップレベルに `README.md` と `AGENTS.md` があり、詳細資料は `docs/` 以下に配置されます
- ソースコードは `src/` 配下にあり、`index.ts` がエントリーポイントとして設定検証、DB/ブラウザ初期化、企業データの読み込みと並列処理、CSV 出力までを統括します
- アーキテクチャは「companies.csv → 固定URL → Playwright取得 → 正規表現 → LLM(OpenRouter) → SQLite/CSV保存 → 人手レビュー」という流れで構成されています

## 新規参加者が知っておくべき重要事項
- 環境変数は `.env` に `OPENROUTER_API_KEY` と `OPENROUTER_MODEL_ID` などを設定します
- 入力データは `data/companies.csv`（`id`,`name`）と `data/urls.csv`（`company_id`,`url`,`source_type`,`priority`）を用意し、優先度はガイドラインに従って付与します
- 開発・検証コマンドは `npm run build`、`npm run dev`、`npm test` などで、TypeScript・Playwright・Vitest を使用します
- コミットは「1 変更 1 コミット」を原則とし、短い命令形メッセージと関連 Issue の参照を推奨しています

## 次に学習・確認すると良い項目
1. **背景と仕様の理解**: `docs/requirements.md` で目的・機能要件・非機能要件を把握し、全体像を掴む
2. **設計と技術詳細の確認**: `docs/design.md` と `docs/technical_design.md` で処理フローと使用技術を確認し、各モジュールの役割を把握する
3. **セットアップとデータ準備**: `docs/manual/setup.md` と `docs/manual/data_prep.md` に従って `.env` と各 CSV を作成する
4. **タスク管理資料の参照**: `tasks-cli.md` や `tasks-frontend.md` で未完了タスクや運用フローを確認し、担当領域を把握する
5. **テストコードの活用**: `tests/` ディレクトリで既存モジュールの利用例を学び、必要に応じて `npm test` で挙動を確認する
