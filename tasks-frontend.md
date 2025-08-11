# タスク（フロントエンド・レビューUI）

目的: 証跡を確認して「OK/NG/不明」を判断し、上書き値・メモを保存できるローカルUIを提供する。

参考: `docs/frontend/design.md`（設計）、`docs/schemas/review.schema.json`（スキーマ）、`docs/manual/review_workflow.md`（運用）。

## TODO（計画・範囲）
- [x] スコープ確定（一覧/詳細/編集/保存/検索・フィルタ/スキーマ検証）（担当: Codex）
- [x] 非スコープ明確化（公開・認証・多人数編集・非ローカル保存・エクスポート・A11y・未保存ガード）（担当: Codex）
- [x] ペルソナ合意（リサーチ担当、監修者）（担当: Codex）

## TODO（技術選定）
- [x] Next.js 14 App Router + TypeScript + Tailwind（daisyUI 任意）（選定: Codex、セットアップ: Claude）
- [x] 状態管理: React Context + useReducer（最小依存）（選定: Codex、実装: Claude）
- [ ] AJV によるスキーマ検証の導入（担当: Claude）
  
### TODO（実装ガイド）
- [x] ページ構成: `/` 一覧、`/company/[id]` 詳細（担当: Codex/Claude）
- [x] コンポーネント粒度: EvidenceCard/DecisionControls/Filters/Toolbar（担当: Codex/Claude）
- [x] スタイル: Tailwind基調、ダークモード任意（将来）（担当: Claude）

## TODO（ユースケース）
- [x] 企業単位の一括確認と判定（OK/NG/不明、上書き値、メモ）（担当: Codex）
- [x] 信頼度や種別での絞り込み（score、source_type）（担当: Codex）
- [ ] 未判定/エラーの抽出による効率化（担当: Codex）
- [x] レビュー進捗（完了件数・未保存件数）の可視化（担当: Codex）

## TODO（画面/UX）
- [x] 一覧: 企業別サマリと現在の決定を表示（仕様: Codex、実装: Claude）
- [x] 一覧: 検索・フィルタ（状態/score範囲/source_type/抽出方法/エラー/未判定）（仕様: Codex、実装: Claude）
- [ ] 一覧: 並び替え（会社名/score/更新日時）（仕様: Codex、実装: Claude）
- [x] 詳細: 証跡カード（URL/タイトル/抜粋/score/source_type/取得日時/方法/HTTP ステータス）（仕様: Codex、実装: Claude）
- [x] 詳細: 決定入力（decision/override_value/note）（仕様: Codex、実装: Claude）
- [-] 共通: 未保存ガード（最小フェーズでは除外）（仕様: Codex）
- [x] 共通: ツールバー（保存のみ。ダウンロード/インポートは除外）（仕様: Codex、実装: Claude）
  
### TODO（フィルタ仕様・並び替え詳細）
- [x] 状態フィルタ: ok/ng/unknown/未判定のみ（複数選択可・デフォルト=全て）（担当: Claude）
- [ ] scoreフィルタ: 下限/上限スライダー（0.0〜1.0、刻み0.05、デフォルト=全域）（担当: Codex）
- [ ] source_type: チェックボックス群（official/ir/pdf/gov/wiki/news/agg/web/api/manual）（担当: Codex）
- [ ] 方法フィルタ: extraction_method（regex/llm/failed）（担当: Codex）
- [ ] 失敗のみ: value=null またはエラー有のevidence優先を抽出（担当: Codex）
- [ ] 並び替え優先: 決定状態→score降順→更新日時降順（デフォルト）（担当: Codex）

### TODO（ナビゲーション/ルーティング）
- [ ] URLクエリでフィルタ/ソート/ページング状態を保持（共有可能）（仕様: Codex、実装: Claude）
- [ ] 企業詳細の深いリンク（`/company/[id]`）でブラウザ戻る/進むと状態維持（仕様: Codex、実装: Claude）
- [ ] 選択企業のハイライトとキーボード移動（↑/↓で次/前へ）（仕様: Codex、実装: Claude）

## TODO（データ I/F）
- [x] 入力: `review.json` を読み込み（required: generated_at, companies[], evidence[], review_state[]）（担当: Codex）
- [x] 読み込み経路: `public/review.json`（静的ファイル）（担当: Codex）
- [ ] バリデーション: `ajv` によるスキーマ検証（エラー可視化）（担当: Claude）
- [x] ローカル保存: 保存ボタンで `localStorage` に書き込み（自動保存なし）（担当: Claude）
- [x] 復元: 初期ロード時に `localStorage` を読み込み（キーがあれば）（担当: Claude）
  
### TODO（データマッピング・整合性）
- [x] UIモデル←→スキーマのマッピング表を作成（company/evidence/review_state）（担当: Codex）
- [ ] null/未定義の扱いを定義（override_value/note/score等）（担当: Codex）
- [x] evidenceの最新/代表選定ロジック（score降順/時刻/優先source_type）（仕様: Codex、実装: Claude）
- [x] `decided_at` は保存時にクライアントで付与（ISO 8601）（仕様: Codex、実装: Claude）

### TODO（AJV 導入の最小要件）
- 参照スキーマ: `docs/schemas/review.schema.json`（JSON Schema 2020-12）。単一の信頼ソースとして管理。
- ライブラリ: `ajv@^8`（`allErrors: true`、`strict: false`）、必要に応じて `ajv-formats` を追加（`date-time` 等）。
- 取り込み/配置: フロントエンドからは `public/schemas/review.schema.json` を参照（当面は手動同期）。将来はビルドスクリプトで同期自動化を検討。
- 検証タイミング:
  - 読込時: `review.json` ロード直後にスキーマ検証。失敗時は一覧/詳細を表示せず、ページ上部にエラーブロック（要約）を表示。
  - 保存前: UI 状態から保存対象 JSON を組み立ててスキーマ検証。失敗時は保存を中断し、エラーブロック（要約）を表示。
- エラー表示（最小）:
  - 表示箇所: ページ上部のエラーバナー（赤）。件数と先頭5件を列挙（`instancePath` と `message`）。
  - 詳細: すべてのエラーは `console.error` に出力（開発時の調査用）。
- パフォーマンス: AJV のコンパイルは初期化時に1回のみ実施し、バリデータをキャッシュ。
- 受入（AJV観点）:
  - 読込/保存の双方でスキーマ適合に合格すること。
  - 不合格時は UI が明確に中断/警告し、原因が要約で把握できること。
- 実装タスク（担当: Claude）:
  - スキーマ取り込みと AJV 初期化（`ajv-formats` 含む）。
  - 読込時/保存前の検証フックの追加。
  - エラーバナー表示コンポーネント（簡易版）の実装。

## TODO（機能）
- [x] 検索/フィルタ/ソート（URLクエリ共有は任意）（担当: Claude）
- [x] 編集（decision/override_value/note）と 1 段階の Undo は任意（最小では省略可）（担当: Claude）
- [x] 保存時に `review_state` を更新し `decided_at` を ISO 8601 付与（担当: Claude）
- [-] エクスポート: レビュー済みのみ CSV（本フェーズでは削除）
- [ ] 差分ハイライト（任意、直前 bundle との比較）（担当: Claude）
  
### TODO（CSVエクスポート仕様）
- 本フェーズ対象外（将来の拡張用に仕様書は保持）

### TODO（状態管理/保存）
- [ ] ローカル保存: 保存ボタンで `localStorage` へ書き込み（自動保存なし）（担当: Claude）
- [ ] 復元: 初期ロード時に `localStorage` を読み込み（キーがあれば）（担当: Claude）
- [-] 未保存件数アイコン/未保存ガード/履歴Undo（最小フェーズでは除外）

 

## TODO（エラー/例外）
- [ ] スキーマ不一致時の詳細表示と読込中断、サンプル JSON への導線（担当: Claude）
- [ ] 破損/空ファイル時の明示エラーとリトライ動線（担当: Claude）
  
### TODO（エラーパターン詳細）
- [ ] JSON解析失敗/文字化け: ファイル情報と再読込導線（担当: Codex）
- [ ] 例外ハンドラ（Error Boundary）でUI崩壊を防止（担当: Claude）



## TODO（連携フロー）
- [x] CLI: `poc bundle` で `output/review/review.json` 生成（担当: Codex）
- [x] Frontend: `public/review.json` を静的読込（担当: Claude）
- [x] UI レビュー→保存（localStorage へ保存）（担当: ユーザー／Claude）

## TODO（受入基準）
- [ ] スキーマ適合（読込/保存時にAJV合格）（担当: Codex）
- [x] 基本フロー（一覧/詳細/編集/保存）がローカルで完結（担当: Claude）
  
### TODO（受入シナリオの詳細）
- [ ] サンプル `review.json`（10社/100evidence相当）で一覧が2秒以内に描画（担当: Codex）
- [ ] フィルタ: unknownのみ + score>=0.8 + source_type=official で結果が即時反映（担当: Codex）
- [ ] 詳細で decision=ok + override=1234 + note 入力→保存→一覧・詳細に反映（担当: Codex）

## TODO（マイルストーン）
- [x] M1: 静的読込 + 一覧/詳細表示 + ローカル保存（JSONダウンロード無し）（担当: Claude）
- [ ] M2: 検索/フィルタ/ソート + スキーマ検証（AJV）（担当: Codex）
- [ ] M3: 使い勝手調整（ショートカット任意/軽微な性能調整）（担当: Codex）

## 実装タスク（Claude・作業順）

### M1 — 基本表示とローカル保存
- [x] ルーティング最小構成: `/` と `/company/[id]` を作成（担当: Claude）
- [x] 状態管理: React Context + useReducer の骨格（型/初期状態/アクション）を実装（担当: Claude）
- [x] データ読込: `public/review.json` を fetch → 状態へ取り込み（担当: Claude）
- [x] 一覧ビュー: 企業サマリ＋現在の決定を表示（担当: Claude）
- [x] 詳細ビュー: EvidenceCard/DecisionControls で編集可能に（担当: Claude）
- [x] 保存: ツールバーの「保存」で `localStorage` に書込（キー: `review_state_v1`）、初期ロード時に復元（担当: Claude）

### M2 — 検索/フィルタ/ソート + AJV
- [x] 検索・フィルタの最小実装（状態/score/source_type/unknown 抽出）（担当: Claude）
- [ ] ソート（会社名/score/更新日時のうち最低1種 + 既定順）（担当: Claude）
- [ ] AJV 初期化: `public/schemas/review.schema.json` を参照、`ajv-formats` 追加（担当: Claude）
- [ ] 検証フック: 読込時/保存前にスキーマ検証を実施（担当: Claude）
- [ ] エラーバナー: 件数＋先頭5件の要約表示、詳細は `console.error`（担当: Claude）

### M3 — 使い勝手調整（任意）
- [ ] ローディング/エンプティ/エラーの表示整理（担当: Claude）
- [ ] 検索/フィルタ/ソートの調整と軽微なリファクタ（担当: Claude）
- [ ] ショートカット対応（任意）（担当: Claude）
  
### TODO（成果物の明確化）
- [ ] M1 成果: `/public/review.json` 想定のスタブとUIワイヤーフレーム（担当: Codex）
- [ ] M2 成果: AJV検証ログとフィルタ仕様ドキュメント（担当: Codex）
- [ ] M3 成果: パフォーマンス計測結果（Lighthouse or 手計測）（担当: Codex）

## TODO（ドキュメント/レビュー）
- [ ] `docs/frontend/design.md` と本 TODO の整合性を維持（担当: Codex）
- [ ] `docs/manual/review_workflow.md` に UI チェックリスト/スクショ追記（担当: Codex／ユーザー）
- [ ] レビュー観点（スキーマ遵守/ローカル完結/誤操作防止/性能/可読性）の合意（担当: Codex）
  
### TODO（追補ドキュメント）
- [x] UIデータマッピング表（schema→UI）: `docs/frontend/ui-data-mapping.md`（担当: Codex）
- [x] CSVエクスポート仕様書（列/型/例）: `docs/frontend/csv-export-spec.md`（本フェーズ対象外／将来拡張用、担当: Codex）
- [ ] キーボード操作一覧とアクセシビリティ方針の明文化（担当: Codex）

## 非スコープ（明記）
- レスポンシブ対応、Chrome以外のブラウザ、アクセシビリティ強化
- エクスポート（CSV/JSON）、インポート、自動保存、未保存ガード
- 認証、複数人同時編集、サーバ保存、暗号化
