# タスク（CLI・バックエンド）

CLIで収集/抽出/保存/エクスポートを担う。OpenRouter専用・Playwright取得方針に沿って、人手確認のための証跡を出力できる形に整える。

担当区分の凡例: （担当: Codex）= 要件定義/運用設計/文書化、（担当: Claude）= 実装/テスト、（担当: ユーザー）= 人手オペレーション/承認。

関連ドキュメント: `docs/manual/setup.md`, `docs/manual/data_prep.md`, `docs/manual/source_guidelines.md`, `docs/manual/review_workflow.md`, `docs/schemas/review.schema.json`, `docs/frontend/design.md`

## 0. 整合性の是正（OpenRouter専用）
- [x] `src/config.ts`: `llmProvider`, `ollama*`, `serpApiKey` を除去し、`OPENROUTER_API_KEY`/`OPENROUTER_MODEL_ID` のみに簡素化（担当: Claude）
- [x] `.env.example`: OpenRouter関連のみ残す（キーの書式注記含む）（担当: Claude）
- [x] `printConfig()` 出力から不要項目を削除（SerpApi/Ollama）（担当: Claude）
- [ ] 受入: `npm run start -- --help` 出力と `docs/*` の記述が一致（担当: Codex）

## 1. 取得と抽出の強化
- [x] Playwright設定を環境変数化（`REQUEST_TIMEOUT_MS`, `USER_AGENT`, `NAV_WAIT_MS`）（担当: Claude）
- [x] 抽出スニペット: マッチ周辺 N 文字とCSS近傍（親要素見出し等）を `raw_text` に格納（担当: Claude）
- [x] priority順フォールバックの詳細ログ（どのURLで成功/失敗/理由）（担当: Claude）
- [x] 受入: ログにURLごとの結果と根拠が残り、デバッグなしでも追跡可能（担当: Codex）

## 2. 証跡（evidence）の拡充（DBと書き出し）
- [ ] `src/db.ts` テーブル拡張: `page_title TEXT`, `status_code INTEGER`, `fetched_at TEXT`, `snippet_start INTEGER`, `snippet_end INTEGER`（担当: Claude）
- [ ] `insertEvidence` 引数拡張と保存（担当: Claude）
- [ ] 失敗時も `source_url` と `error_summary` を保存（担当: Claude）
- 受入: `db.getAllEvidence()` が新フィールドを含む（担当: Codex）

## 3. エクスポート/レビュー用出力
- [ ] `poc export --format csv` の列定義を固定（既存CSVの列を明示）（担当: Claude）
- [ ] `poc export --format json`（frontend向け）を追加: `docs/schemas/review.schema.json` 準拠で `review.json` を生成（担当: Claude）
- [ ] `poc bundle --out output/review/` で `review.json` + 最小UIシェルを配置（担当: Claude）
- [ ] 連携: `frontend/` が存在する場合は `output/review/review.json` を `frontend/public/review.json` にコピーするオプションを用意（担当: Claude）
- 受入: JSONがスキーマで検証でき、`output/review/review.json` が生成される（担当: Codex）

## 4. レビュー状態の管理
- [ ] `review_state` テーブル新設: `company_id, decision(ok|ng|unknown), decided_at, note, override_value`（担当: Claude）
- [ ] `poc import --review path/to/review.json` で人手判定を反映（担当: Claude）
- [ ] `poc export --final csv` で最終値（override優先→evidence最良）を出力（担当: Claude）
- 受入: 反映→最終出力までの往復が可能（担当: Codex）

## 5. 運用補助
- [ ] `data/urls.csv` の静的検証コマンド（重複URL、異常priority、無効ドメイン）（担当: Claude）
- [ ] `gemini` 提案結果の整形スクリプト（CSV→source_type/priority 正規化）（担当: Claude）
- [ ] ログファイル出力（`output/logs/`）と `LOG_LEVEL` 切替（担当: Claude）

## 6. ドキュメント
- [ ] `docs/manual/review_workflow.md` 作成（CLI→bundle→フロントエンド確認の流れ）（担当: Codex）
- [ ] `README` のCLI章更新（使い方例、オプション一覧）（担当: Codex）

## 7. Next.js 連携（補足）
- [ ] `.env` に `REVIEW_JSON_PATH` を設定できるようにし、API Routeから参照可能にする（Next.js側と共有する場合）（担当: Claude）
- [ ] バンドル時に `review.json` の生成時刻 `generated_at` を付与（フロントに表示）（担当: Claude）

## 付録: review.json スキーマ（概要）
- 参照: `docs/schemas/review.schema.json`
- 構成:
  - companies: `{ id, name }[]`
  - evidence: `{ company_id, value, raw_text, source_url, source_type, page_title, status_code, score, model, extracted_at }[]`
  - review_state: `{ company_id, decision, note, override_value, decided_at }[]`

---

# タスク（フロントエンド・レビューUI）

目的: 人が証跡を見て「OK/NG/不明」を判断し、根拠リンクと抜粋テキストを確認・編集・保存できるローカルUIを提供する。

技術スタック（提案）: Next.js 14（App Router）+ TypeScript + Tailwind CSS（必要に応じて daisyUI）。

## 1. 要件定義
- [ ] 画面一覧（一覧・詳細・検索/フィルタ）とナビゲーションを定義
- [ ] 最終決定フィールド（decision/override_value/note）の定義
- [ ] I/F定義: 入出力は `review.json`（`docs/schemas/review.schema.json`）準拠

## 2. データI/F
- [ ] 入力: CLIの `poc bundle` が生成する `review.json`
- [ ] 保存: JSONダウンロード（ローカル）、またはローカルサーバ `POST /review`（選択式）
- [ ] セキュア: ローカル限定起動（固定ポート、CORS制限）

## 3. 画面/機能
- [ ] 一覧: 企業ごとの抽出結果・最終決定の一覧、検索/フィルタ（状態、信頼度、失敗のみ等）
- [ ] 詳細: 証跡（URL、タイトル、抜粋、抽出手段、スコア、日時）をカード表示、リンクは新規タブで開く
- [ ] 編集: OK/NG/不明の選択、値の上書き、メモ、保存
- [ ] 差分表示: 変更多発の企業のハイライト
- [ ] エクスポート: レビュー済みのみCSV出力（companies+最終決定）

## 4. 技術選定（更新）
- [ ] Next.js 14 App Router（`app/`）+ TypeScript + Tailwind CSS（daisyUI任意）
- [ ] データ読み込み: `public/review.json`（静的）または API Route `GET /api/review`
- [ ] 保存方式: JSONダウンロード or API Route `POST /api/review` → ローカルに保存
- [ ] バリデーション: `ajv` で `docs/schemas/review.schema.json` を検証

## 5. 連携フロー（人手）
- [ ] CLI: `poc bundle` 実行→ `output/review/` に review.json + 静的UI を生成
- [ ] ユーザー: ブラウザで `index.html` を開いて確認・判定
- [ ] 保存: JSONをダウンロード or ローカルサーバへPOST
- [ ] CLI: `poc import --review path/to/review.json` でDBに反映→CSV最終出力

## 6. ドキュメント
- [ ] `docs/manual/review_workflow.md` にUIの使い方・保存方法・制約を記載
- [ ] スクリーンショットとチェックリスト（全件レビューの確認）

## 受入基準
- [ ] review.json の読み込みバリデーションが通る（スキーマ準拠）
- [ ] 一覧/詳細/編集/保存の基本フローがローカルで完結
- [ ] エクスポートした最終CSVがCLIの `export --final` と一致

備考: フロントエンドの詳細タスクは `tasks-frontend.md` を参照。（調整/文書: 担当: Codex、実装: 担当: Claude、オペレーション: 担当: ユーザー）
