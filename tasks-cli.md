# タスク（CLI・バックエンド）

CLIで収集/抽出/保存/エクスポートを担う。OpenRouter専用・Playwright取得方針に沿って、人手確認のための証跡を出力できる形に整える。

担当の凡例: （担当: Codex）= 要件定義/運用設計/文書化、（担当: Claude）= 実装/テスト、（担当: ユーザー）= 人手オペレーション/承認。

関連: `docs/manual/setup.md`, `docs/manual/data_prep.md`, `docs/manual/source_guidelines.md`, `docs/manual/review_workflow.md`, `docs/schemas/review.schema.json`, `docs/frontend/design.md`, `tasks-frontend.md`

実装タスク（別文書）
- CLI の実装計画は `docs/cli/implementation-plan.md` に分離（担当: Claude）。

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
- 詳細な検証メモは `docs/cli/validation-notes.md` に分離。

備考: フロントエンド側の詳細タスクは `tasks-frontend.md` を参照（Codex: 設計/文書、Claude: 実装、ユーザー: オペレーション）。
