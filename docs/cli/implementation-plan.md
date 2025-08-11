# CLI 実装タスク（Claude・作業順）

目的: CLI での収集/抽出/出力/往復を最小スコープで実装・整備する。仕様は `tasks-cli.md` と各設計文書（manual/requirements/design/technical_design）を正とする。

参照
- 仕様/TODO: `tasks-cli.md`
- コマンド一覧: `docs/cli-commands.md`
- スキーマ: `docs/schemas/review.schema.json`
- 運用: `docs/manual/*.md`

## M1 — 設定整備と取得/抽出の安定化
- [ ] 設定統合: OpenRouter 集約（.env/.env.example、`printConfig()` の整合）
- [ ] Playwright 設定の外出し（`REQUEST_TIMEOUT_MS`, `USER_AGENT`, `NAV_WAIT_MS`）
- [ ] 抽出スニペットを `raw_text` に格納（マッチ周辺/近傍要素）
- [ ] priority フォールバック/失敗理由を詳細ログ化
- [ ] 受入: URL単位で成功/失敗/理由/根拠がログのみで追跡可能

## M2 — 証跡スキーマ/エクスポート/バンドル
- [ ] DB拡張の反映（`page_title`, `status_code`, `fetched_at`, `snippet_start`, `snippet_end`）
- [ ] `poc export --format csv` の列固定（docs と一致）
- [ ] `poc export --format json`（`review.json` 生成、スキーマ準拠）
- [ ] `poc bundle --out output/review/`（`review.json` + 最小 `index.html`）
- [ ] オプション: `frontend/public/review.json` へコピー（frontend 連携）
- [ ] 受入: `output/review/review.json` が構造検証に合格（AJV は別途導入時に厳密化）

## M3 — レビュー状態の往復/最終出力
- [ ] `review_state` テーブルの CRUD（upsert/get/getAll/delete）
- [ ] `poc import --review <path>` でレビュー反映
- [ ] `poc export --final csv` で override 優先の最終値を出力
- [ ] 受入: import → final export の往復で件数・値が期待通り

## 運用補助/ドキュメント
- [ ] `data/urls.csv` 静的検証（重複/priority/ドメイン妥当性）
- [ ] `gemini` 提案結果の正規化スクリプト（CSV→`source_type`/`priority`）
- [ ] ログファイル出力（`output/logs/`）と `LOG_LEVEL` 切替
- [ ] ドキュメント更新（README の CLI 章、manual の再現手順）
- [ ] 受入: `npm run start -- --help` と docs のオプション記載が一致

注意
- 本フェーズの非スコープ（サーバ保存/認証/暗号化 など）には手を入れない。
- 1 トピック = 1 コミット。メッセージは命令形で簡潔に。
