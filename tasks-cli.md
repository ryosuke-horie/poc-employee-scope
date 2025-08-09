# タスク（CLI・バックエンド）

CLIで収集/抽出/保存/エクスポートを担う。OpenRouter専用・Playwright取得方針に沿って、人手確認のための証跡を出力できる形に整える。

## 0. 整合性の是正（OpenRouter専用）
- [ ] `src/config.ts`: `llmProvider`, `ollama*`, `serpApiKey` を除去し、`OPENROUTER_API_KEY`/`OPENROUTER_MODEL_ID` のみに簡素化
- [ ] `.env.example`: OpenRouter関連のみ残す（キーの書式注記含む）
- [ ] `printConfig()` 出力から不要項目を削除（SerpApi/Ollama）
- 受入: `npm run start -- --help` 出力と `docs/*` の記述が一致

## 1. 取得と抽出の強化
- [ ] Playwright設定を環境変数化（`REQUEST_TIMEOUT_MS`, `USER_AGENT`, `NAV_WAIT_MS`）
- [ ] 抽出スニペット: マッチ周辺 N 文字とCSS近傍（親要素見出し等）を `raw_text` に格納
- [ ] priority順フォールバックの詳細ログ（どのURLで成功/失敗/理由）
- 受入: ログにURLごとの結果と根拠が残り、デバッグなしでも追跡可能

## 2. 証跡（evidence）の拡充（DBと書き出し）
- [ ] `src/db.ts` テーブル拡張: `page_title TEXT`, `status_code INTEGER`, `fetched_at TEXT`, `snippet_start INTEGER`, `snippet_end INTEGER`
- [ ] `insertEvidence` 引数拡張と保存
- [ ] 失敗時も `source_url` と `error_summary` を保存
- 受入: `db.getAllEvidence()` が新フィールドを含む

## 3. エクスポート/レビュー用出力
- [ ] `poc export --format csv` の列定義を固定（既存CSVの列を明示）
- [ ] `poc export --format json`（frontend向け）を追加: `docs/schemas/review.schema.json` 準拠で `review.json` を生成
- [ ] `poc bundle --out output/review/` で `review.json` + 最小UIシェルを配置（静的HTMLを置くだけで良い）
- 受入: JSONがスキーマで検証でき、`output/review/review.json` が生成される

## 4. レビュー状態の管理
- [ ] `review_state` テーブル新設: `company_id, decision(ok|ng|unknown), decided_at, note, override_value`
- [ ] `poc import --review path/to/review.json` で人手判定を反映
- [ ] `poc export --final csv` で最終値（override優先→evidence最良）を出力
- 受入: 反映→最終出力までの往復が可能

## 5. 運用補助
- [ ] `data/urls.csv` の静的検証コマンド（重複URL、異常priority、無効ドメイン）
- [ ] `gemini` 提案結果の整形スクリプト（CSV→source_type/priority 正規化）
- [ ] ログファイル出力（`output/logs/`）と `LOG_LEVEL` 切替

## 6. ドキュメント
- [ ] `docs/manual/review_workflow.md` 作成（CLI→bundle→フロントエンド確認の流れ）
- [ ] `README` のCLI章更新（使い方例、オプション一覧）

## 付録: review.json スキーマ（概要）
- 参照: `docs/schemas/review.schema.json`
- 構成:
  - companies: `{ id, name }[]`
  - evidence: `{ company_id, value, raw_text, source_url, source_type, page_title, status_code, score, model, extracted_at }[]`
  - review_state: `{ company_id, decision, note, override_value, decided_at }[]`
