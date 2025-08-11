# タスク（CLI・バックエンド）

CLIで収集/抽出/保存/エクスポートを担う。OpenRouter専用・Playwright取得方針に沿って、人手確認のための証跡を出力できる形に整える。

担当の凡例: （担当: Codex）= 要件定義/運用設計/文書化、（担当: Claude）= 実装/テスト、（担当: ユーザー）= 人手オペレーション/承認。

関連: `docs/manual/setup.md`, `docs/manual/data_prep.md`, `docs/manual/source_guidelines.md`, `docs/manual/review_workflow.md`, `docs/schemas/review.schema.json`, `docs/frontend/design.md`, `tasks-frontend.md`

実装タスク（Claude・作業順）

### M1 — 設定整備と取得/抽出の安定化
- [ ] 設定統合: OpenRouter 集約（.env/.env.example、`printConfig()` の整合）
- [ ] Playwright 設定の外出し（`REQUEST_TIMEOUT_MS`, `USER_AGENT`, `NAV_WAIT_MS`）
- [ ] 抽出スニペットを `raw_text` に格納（マッチ周辺/近傍要素）
- [ ] priority フォールバック/失敗理由を詳細ログ化
- [ ] 受入: URL単位で成功/失敗/理由/根拠がログのみで追跡可能

### M2 — 証跡スキーマ/エクスポート/バンドル
- [ ] DB拡張の反映（`page_title`, `status_code`, `fetched_at`, `snippet_start`, `snippet_end`）
- [ ] `poc export --format csv` の列固定（docs と一致）
- [ ] `poc export --format json`（`review.json` 生成、スキーマ準拠）
- [ ] `poc bundle --out output/review/`（`review.json` + 最小 `index.html`）
- [ ] オプション: `frontend/public/review.json` へコピー（frontend 連携）
- [ ] 受入: `output/review/review.json` が構造検証に合格（AJV は別途導入時に厳密化）

### M3 — レビュー状態の往復/最終出力
- [ ] `review_state` テーブルの CRUD（upsert/get/getAll/delete）
- [ ] `poc import --review <path>` でレビュー反映
- [ ] `poc export --final csv` で override 優先の最終値を出力
- [ ] 受入: import → final export の往復で件数・値が期待通り

## TODO（整合性/設定）
- [x] `src/config.ts` から `ollama*`/`serpApiKey` を除去し OpenRouter へ集約（担当: Claude）
- [x] `.env.example` を OpenRouter 用に簡素化（担当: Claude）
- [x] `printConfig()` の不要項目を削除（担当: Claude）
- [ ] 受入: `npm run start -- --help` と `docs/*` のオプション記載が一致（担当: Codex）

## TODO（取得/抽出）
- [x] Playwright 環境変数化（`REQUEST_TIMEOUT_MS`, `USER_AGENT`, `NAV_WAIT_MS`）（担当: Claude）
- [x] 抽出スニペットを `raw_text` に格納（マッチ周辺 N 文字 + 近傍要素）（担当: Claude）
- [x] priority フォールバック結果を詳細ログ化（担当: Claude）
- [x] 受入: URL単位で成功/失敗/理由/根拠がログだけで追跡可能（担当: Codex）

## TODO（証跡/DB）
- [x] DB拡張: `page_title`, `status_code`, `fetched_at`, `snippet_start`, `snippet_end`（担当: Claude）
- [x] `insertEvidence`/取得系の引数・戻り値拡張（担当: Claude）
- [x] 失敗時にも `source_url`/`error_summary` を保存（担当: Claude）
- [ ] 受入: `db.getAllEvidence()` が上記フィールドを含む（担当: Codex）

## TODO（エクスポート/レビュー出力）
- [x] `poc export --format csv` の列を固定し明記（担当: Claude）
- [x] `poc export --format json` を追加（`review.json` 生成、スキーマ準拠）（担当: Claude）
- [x] `poc bundle --out output/review/` で `review.json` + 最小 `index.html` 作成（担当: Claude）
- [x] `frontend/` 存在時に `frontend/public/review.json` へコピーするオプション（担当: Claude）
- [x] 受入: `output/review/review.json` が生成され、構造検証に合格（AJV未導入のため簡易検証）（担当: Codex）

## TODO（レビュー状態の往復）
- [x] `review_state(company_id, decision, decided_at, note, override_value)` テーブル新設（担当: Claude）
- [x] `poc import --review path/to/review.json` で反映（担当: Claude）
- [x] `poc export --final csv` で最終値（override 優先→evidence 最良）を出力（担当: Claude）
- [ ] 受入: import→final export まで往復でき、件数・値が期待通り（担当: Codex）

## TODO（運用補助）
- [ ] `data/urls.csv` 静的検証コマンド（重複/priority/ドメイン妥当性）（担当: Claude）
- [ ] `gemini` 提案結果の正規化スクリプト（CSV→`source_type`/`priority`）（担当: Claude）
- [ ] ログファイル出力（`output/logs/`）と `LOG_LEVEL` 切替（担当: Claude）

## TODO（ドキュメント）
- [ ] `docs/manual/review_workflow.md` を最新運用で更新（担当: Codex）
- [ ] `README` の CLI 章（使い方/オプション/例）を更新（担当: Codex）

## TODO（Next.js 連携）
- [ ] `.env` に `REVIEW_JSON_PATH` を追加（Next.js API Route で参照）（担当: Claude）
- [ ] バンドル時に `generated_at` を `review.json` へ付与（担当: Claude）

## 受入チェックリスト（CLI総合）
- [ ] ヘルプ出力とドキュメントの一致（コマンド/オプション）※ `README` の例が現行CLIと不一致（要更新）
- [x] ログのみで収集〜抽出の成否/理由が追跡可能（全URL接続失敗のため成功例は未確認）
- [x] `review.json` が検証に合格し、`bundle` が生成（簡易検証・AJV導入待ち）
- [x] `import --review` 後に `export --final` の値が期待通り（override 優先）※ 実装完了、DBからレビュー状態を反映
- [x] CSV エクスポート列が固定・記載と一致（ヘッダ確認済み）
- [ ] ドキュメント（README/マニュアル）が最新で再現可能（要反映）

## 検証結果（メモ）
- 実施日時: 2025-08-09
  - ログ確認: `npm run dev:extended -- extract --parallel 1 --companies data/companies.csv --urls data/urls.csv`
    - 全URLで接続失敗（ERR_TUNNEL_CONNECTION_FAILED）したが開始/エラー理由/フォールバックが記録されURL単位で追跡可能
- 実施日時: 2025-08-10
- ヘルプ確認:
  - `npm run start -- --help`（従来版ヘルプ表示OK）
  - `npm run start:extended -- help`（拡張版ヘルプ表示OK）
- バンドル生成: `npm run start:extended -- bundle --output output/`
  - 生成物: `output/review/review.json`（companies:10, evidence:16, review_state:10）, `output/review/index.html`
  - 構造検証: 必須キー（generated_at/companies/evidence/review_state）存在を確認
- CSV出力: `npm run start:extended -- export --format csv --output output/export.csv`
  - 先頭行: `company_name,employee_count,source_url,source_text,extraction_method,confidence_score,extracted_at,page_title,status_code,error_message`
- 最終CSV（代替手順）: `npm run start:extended -- export --final --review output/review/review.json --output output/final.csv`
  - 動作: レビュー（unknown）を反映しつつ最良evidence情報を出力（import未実装のため代替）
- 実施日時: 2025-08-11
  - review_stateテーブル実装: PR #29でマージ完了
    - テーブル定義、CRUD操作（upsert/get/getAll/delete）実装済み
    - マイグレーションスクリプト（`npm run migrate`）実装済み
    - 単体テスト9ケース全て成功
  - export --final コマンド: 実装済み（exportFinalCSV関数）
    - レビュー結果JSONを読み込み、override_value優先で最終値を出力
  - import --review コマンド: 実装完了
    - `npm run start:extended -- import --review output/review/review.json` でインポート成功
    - 10件全てインポート（imported: 10, skipped: 0）
    - DBからレビュー状態を読み込んで export --final で反映確認

備考: フロントエンド側の詳細タスクは `tasks-frontend.md` を参照（Codex: 設計/文書、Claude: 実装、ユーザー: オペレーション）。
