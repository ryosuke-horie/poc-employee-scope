# フロントエンド実装タスク（Claude・作業順）

目的: 最小スコープ（一覧/詳細/編集/保存（localStorage）/検索・フィルタ/スキーマ検証）に沿って、実装の進行順序を明確化する。仕様は `docs/frontend/design.md` と `tasks-frontend.md` を正とする。

参照
- 仕様: `docs/frontend/design.md`
- TODO: `tasks-frontend.md`
- スキーマ: `docs/schemas/review.schema.json`

## M1 — 基本表示とローカル保存
- [ ] ルーティング最小構成: `/` と `/company/[id]` を作成
- [ ] 状態管理: React Context + useReducer の骨格（型/初期状態/アクション）
- [ ] データ読込: `public/review.json` を fetch → 状態へ取り込み
- [ ] 一覧ビュー: 企業サマリ＋現在の決定を表示
- [ ] 詳細ビュー: EvidenceCard/DecisionControls で編集可能に
- [ ] 保存: ツールバー「保存」で `localStorage` 書込（キー: `review_state_v1`）、初期ロード時に復元

## M2 — 検索/フィルタ/ソート + AJV
- [ ] 検索・フィルタ（状態/score/source_type/unknown 抽出）の最小実装
- [ ] ソート（会社名/score/更新日時のうち最低1種 + 既定順）
- [ ] AJV 初期化: `public/schemas/review.schema.json` を参照、`ajv-formats` 追加
- [ ] 検証フック: 読込時/保存前にスキーマ検証を実施
- [ ] エラーバナー: 件数＋先頭5件の要約表示、詳細は `console.error`

## M3 — 使い勝手調整（任意）
- [ ] ローディング/エンプティ/エラーの表示整理
- [ ] 検索/フィルタ/ソートの調整と軽微なリファクタ
- [ ] ショートカット対応（任意）

注意
- 本フェーズの非スコープ（CSV/JSONエクスポート、インポート、自動保存、未保存ガード、認証/サーバ保存/暗号化、レスポンシブ対応等）には手を入れない。
- 変更は小さく、コミットは 1 トピック = 1 コミット。

