# タスク（フロントエンド・レビューUI）

目的: 証跡を確認して「OK/NG/不明」を判断し、上書き値・メモを保存できるローカルUIを提供する。

参考: `docs/frontend/design.md`（設計）、`docs/schemas/review.schema.json`（スキーマ）、`docs/manual/review_workflow.md`（運用）。

## TODO（計画・範囲）
- [ ] スコープ確定（一覧/詳細/編集/保存/エクスポート/検索・フィルタ/スキーマ検証/未保存ガード）
- [ ] 非スコープ明確化（公開・認証・多人数編集・非ローカル保存等）
- [ ] ペルソナ合意（リサーチ担当、監修者）

## TODO（ユースケース）
- [ ] 企業単位の一括確認と判定（OK/NG/不明、上書き値、メモ）
- [ ] 信頼度や種別での絞り込み（score、source_type）
- [ ] 未判定/エラーの抽出による効率化
- [ ] レビュー進捗（完了件数・未保存件数）の可視化

## TODO（画面/UX）
- [ ] 一覧: 企業別サマリと現在の決定を表示
- [ ] 一覧: 検索・フィルタ（状態/score範囲/source_type/抽出方法/エラー/未判定）
- [ ] 一覧: 並び替え（会社名/score/更新日時）
- [ ] 詳細: 証跡カード（URL/タイトル/抜粋/score/source_type/取得日時/方法/HTTP ステータス）
- [ ] 詳細: 決定入力（decision/override_value/note）
- [ ] 共通: 未保存ガード（遷移/クローズ時警告）
- [ ] 共通: ツールバー（保存/ダウンロード/インポート）

## TODO（データ I/F）
- [ ] 入力: `review.json` を読み込み（required: generated_at, companies[], evidence[], review_state[]）
- [ ] 読み込み経路: `public/review.json` または `GET /api/review`
- [ ] 保存経路: JSON ダウンロード または `POST /api/review`（ローカル限定）
- [ ] バリデーション: `ajv` によるスキーマ検証（エラー可視化）

## TODO（機能）
- [ ] 検索/フィルタ/ソート（URLクエリで状態共有）
- [ ] 編集（decision/override_value/note）と 1 段階の Undo
- [ ] 保存時に `review_state` を更新し `decided_at` を ISO 8601 付与
- [ ] エクスポート: レビュー済みのみ CSV（companies + 最終決定）
- [ ] 差分ハイライト（任意、直前 bundle との比較）

## TODO（非機能）
- [ ] パフォーマンス: 1,000 社/10,000 evidence で一覧 2s/詳細 1s 以内
- [ ] UX: キーボードショートカット（1=ok, 2=ng, 3=unknown, s=保存）
- [ ] 可用性: オフライン動作（ネット未接続でも保存可）
- [ ] セキュリティ: ローカル限定・外部送信なし、API は CORS 無効/同一オリジンのみ

## TODO（エラー/例外）
- [ ] スキーマ不一致時の詳細表示と読込中断、サンプル JSON への導線
- [ ] 破損/空ファイル時の明示エラーとリトライ動線
- [ ] 保存失敗（API）の理由表示・再試行・JSON ダウンロード代替

## TODO（技術選定）
- [ ] Next.js 14 App Router + TypeScript + Tailwind（daisyUI 任意）
- [ ] 状態管理（Context または Zustand）
- [ ] AJV によるスキーマ検証の導入

## TODO（連携フロー）
- [ ] CLI: `poc bundle` で `output/review/review.json` 生成
- [ ] Frontend: `public/review.json` 配置 or `GET /api/review` 実装
- [ ] UI レビュー→保存（ダウンロード or `POST /api/review`）
- [ ] CLI: `poc import --review` → `export --final`

## TODO（受入基準）
- [ ] スキーマ適合（読込時に検証合格）
- [ ] 基本フロー（一覧/詳細/編集/保存）がローカルで完結
- [ ] 出力 CSV が CLI `export --final` と一致（同一入力）
- [ ] 未保存ガードとショートカットが有効

## TODO（マイルストーン）
- [ ] M1: 静的読込 + 一覧/詳細表示 + JSON ダウンロード保存
- [ ] M2: 検索/フィルタ/ソート + スキーマ検証 + 未保存ガード
- [ ] M3: API 入出力（ローカル）+ CSV エクスポート
- [ ] M4: 使い勝手調整（ショートカット/差分/パフォーマンス）

## TODO（ドキュメント/レビュー）
- [ ] `docs/frontend/design.md` と本 TODO の整合性を維持
- [ ] `docs/manual/review_workflow.md` に UI チェックリスト/スクショ追記
- [ ] レビュー観点（スキーマ遵守/ローカル完結/誤操作防止/性能/可読性）の合意
