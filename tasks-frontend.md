# タスク（フロントエンド・レビューUI）

目的: 証跡を確認して「OK/NG/不明」を判断し、上書き値・メモを保存できるローカルUIを提供する。

参考: `docs/frontend/design.md`（設計）、`docs/schemas/review.schema.json`（スキーマ）、`docs/manual/review_workflow.md`（運用）。

## TODO（計画・範囲）
- [ ] スコープ確定（一覧/詳細/編集/保存/エクスポート/検索・フィルタ/スキーマ検証/未保存ガード）（担当: Codex）
- [ ] 非スコープ明確化（公開・認証・多人数編集・非ローカル保存等）（担当: Codex）
- [ ] ペルソナ合意（リサーチ担当、監修者）（担当: Codex）

## TODO（ユースケース）
- [ ] 企業単位の一括確認と判定（OK/NG/不明、上書き値、メモ）（担当: Codex）
- [ ] 信頼度や種別での絞り込み（score、source_type）（担当: Codex）
- [ ] 未判定/エラーの抽出による効率化（担当: Codex）
- [ ] レビュー進捗（完了件数・未保存件数）の可視化（担当: Codex）

## TODO（画面/UX）
- [ ] 一覧: 企業別サマリと現在の決定を表示（仕様: Codex、実装: Claude）
- [ ] 一覧: 検索・フィルタ（状態/score範囲/source_type/抽出方法/エラー/未判定）（仕様: Codex、実装: Claude）
- [ ] 一覧: 並び替え（会社名/score/更新日時）（仕様: Codex、実装: Claude）
- [ ] 詳細: 証跡カード（URL/タイトル/抜粋/score/source_type/取得日時/方法/HTTP ステータス）（仕様: Codex、実装: Claude）
- [ ] 詳細: 決定入力（decision/override_value/note）（仕様: Codex、実装: Claude）
- [ ] 共通: 未保存ガード（遷移/クローズ時警告）（仕様: Codex、実装: Claude）
- [ ] 共通: ツールバー（保存/ダウンロード/インポート）（仕様: Codex、実装: Claude）
  
### TODO（フィルタ仕様・並び替え詳細）
- [ ] 状態フィルタ: ok/ng/unknown/未判定のみ（複数選択可・デフォルト=全て）（担当: Codex）
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
- [x] 読み込み経路: `public/review.json` または `GET /api/review`（担当: Codex）
- [ ] 保存経路: JSON ダウンロード または `POST /api/review`（ローカル限定）（担当: Claude）
- [ ] バリデーション: `ajv` によるスキーマ検証（エラー可視化）（担当: Claude）
  
### TODO（データマッピング・整合性）
- [x] UIモデル←→スキーマのマッピング表を作成（company/evidence/review_state）（担当: Codex）
- [ ] null/未定義の扱いを定義（override_value/note/score等）（担当: Codex）
- [ ] evidenceの最新/代表選定ロジック（score降順/時刻/優先source_type）（仕様: Codex、実装: Claude）
- [x] `decided_at` は保存時にクライアントで付与（ISO 8601）（仕様: Codex、実装: Claude）
- [ ] JSONインポート: `<input type=\"file\">` から `review.json` を読み込み可能に（ドラッグ&ドロップ対応）（担当: Claude）

## TODO（機能）
- [ ] 検索/フィルタ/ソート（URLクエリで状態共有）（担当: Claude）
- [ ] 編集（decision/override_value/note）と 1 段階の Undo（担当: Claude）
- [x] 保存時に `review_state` を更新し `decided_at` を ISO 8601 付与（担当: Claude）
- [ ] エクスポート: レビュー済みのみ CSV（companies + 最終決定）（担当: Claude）
- [ ] 差分ハイライト（任意、直前 bundle との比較）（担当: Claude）
  
### TODO（CSVエクスポート仕様）
- [ ] 列定義（固定）: company_id, company_name, decision, override_value, final_value, note, source_url, confidence_score, extraction_method, decided_at（担当: Codex）
- [ ] 並び順: company_id 昇順（担当: Codex）
- [ ] 文字コード: UTF-8（BOMなし）（担当: Codex）
- [ ] 小数/NULLの表現ルールを定義（担当: Codex）

### TODO（状態管理/保存）
- [ ] ローカルドラフト（localStorage）に自動保存（5秒おき・軽量差分）（担当: Claude）
- [ ] ドラフトの復元/破棄UI（担当: Claude）
- [ ] 未保存変更の件数表示（ヘッダーにアイコン）（担当: Claude）
- [ ] 変更履歴は1段階Undoのみ（再読み込みで破棄）（担当: Claude）

## TODO（非機能）
- [ ] パフォーマンス: 1,000 社/10,000 evidence で一覧 2s/詳細 1s 以内（要件: Codex、実装/計測: Claude）
- [ ] UX: キーボードショートカット（1=ok, 2=ng, 3=unknown, s=保存）（要件: Codex、実装: Claude）
- [ ] 可用性: オフライン動作（ネット未接続でも保存可）（要件: Codex、実装: Claude）
- [ ] セキュリティ: ローカル限定・外部送信なし、API は CORS 無効/同一オリジンのみ（要件: Codex、実装: Claude）
  
### TODO（A11y/i18n/ブラウザ対応）
- [ ] A11y: フォーカス可視、ランドマーク/ラベル適切、コントラスト遵守（要件: Codex、実装: Claude）
- [ ] A11y: エラーは `aria-live` で通知、キーボード操作可能（要件: Codex、実装: Claude）
- [ ] i18n: 日本語既定、表示文字列を一元管理（英語切替は将来対応）（要件: Codex、実装: Claude）
- [ ] ブラウザ: 最新 Chrome/Safari/Firefox で基本動作確認（担当: ユーザー）

## TODO（エラー/例外）
- [ ] スキーマ不一致時の詳細表示と読込中断、サンプル JSON への導線（担当: Claude）
- [ ] 破損/空ファイル時の明示エラーとリトライ動線（担当: Claude）
- [ ] 保存失敗（API）の理由表示・再試行・JSON ダウンロード代替（担当: Claude）
  
### TODO（エラーパターン詳細）
- [ ] ネットワーク不通（API読込/保存）: リトライ/オフライン保存誘導（担当: Codex）
- [ ] CORSブロック: エラーメッセージとローカル限定の注記（担当: Codex）
- [ ] JSON解析失敗/文字化け: ファイル情報と再読込導線（担当: Codex）
- [ ] 例外ハンドラ（Error Boundary）でUI崩壊を防止（担当: Claude）

## TODO（技術選定）
- [ ] Next.js 14 App Router + TypeScript + Tailwind（daisyUI 任意）（選定: Codex、セットアップ: Claude）
- [ ] 状態管理（Context または Zustand）（選定: Codex、実装: Claude）
- [ ] AJV によるスキーマ検証の導入（担当: Claude）
  
### TODO（実装ガイド）
- [ ] ページ構成: `/` 一覧、`/company/[id]` 詳細（担当: Codex）
- [ ] コンポーネント粒度: EvidenceCard/DecisionControls/Filters/Toolbar（担当: Codex）
- [ ] 仮API: `/api/review` GET/POST（ローカル限定・CORS無効）（担当: Claude）
- [ ] スタイル: Tailwind基調、ダークモード任意（将来）（担当: Claude）

## TODO（連携フロー）
- [x] CLI: `poc bundle` で `output/review/review.json` 生成（担当: Codex）
- [ ] Frontend: `public/review.json` 配置 or `GET /api/review` 実装（担当: Claude）
- [ ] UI レビュー→保存（ダウンロード or `POST /api/review`）（担当: ユーザー／Claude）
- [ ] CLI: `poc import --review` → `export --final`（importは未実装、export --finalは実装済み）（担当: Claude）

## TODO（受入基準）
- [ ] スキーマ適合（読込時に検証合格）（担当: Codex）
- [ ] 基本フロー（一覧/詳細/編集/保存）がローカルで完結（担当: Codex）
- [ ] 出力 CSV が CLI `export --final` と一致（同一入力）（担当: Codex）
- [ ] 未保存ガードとショートカットが有効（担当: Codex）
  
### TODO（受入シナリオの詳細）
- [ ] サンプル `review.json`（10社/100evidence相当）で一覧が2秒以内に描画（担当: Codex）
- [ ] フィルタ: unknownのみ + score>=0.8 + source_type=official で結果が即時反映（担当: Codex）
- [ ] 詳細で decision=ok + override=1234 + note 入力→保存→CSVに反映（担当: Codex）
- [ ] ブラウザ更新後もドラフト復元が可能（未保存時）（担当: Codex）
- [ ] JSON手動インポート→一覧/詳細に即時反映（AJV合格）（担当: Codex）

## TODO（マイルストーン）
- [ ] M1: 静的読込 + 一覧/詳細表示 + JSON ダウンロード保存（担当: Codex）
- [ ] M2: 検索/フィルタ/ソート + スキーマ検証 + 未保存ガード（担当: Codex）
- [ ] M3: API 入出力（ローカル）+ CSV エクスポート（担当: Codex）
- [ ] M4: 使い勝手調整（ショートカット/差分/パフォーマンス）（担当: Codex）
  
### TODO（成果物の明確化）
- [ ] M1 成果: `/public/review.json` 想定のスタブとUIワイヤーフレーム（担当: Codex）
- [ ] M2 成果: AJV検証ログとフィルタ仕様ドキュメント（担当: Codex）
- [ ] M3 成果: CSVサンプル（10行）とAPIモック（担当: Codex）
- [ ] M4 成果: パフォーマンス計測結果（Lighthouse or 手計測）（担当: Codex）

## TODO（ドキュメント/レビュー）
- [ ] `docs/frontend/design.md` と本 TODO の整合性を維持（担当: Codex）
- [ ] `docs/manual/review_workflow.md` に UI チェックリスト/スクショ追記（担当: Codex／ユーザー）
- [ ] レビュー観点（スキーマ遵守/ローカル完結/誤操作防止/性能/可読性）の合意（担当: Codex）
  
### TODO（追補ドキュメント）
- [x] UIデータマッピング表（schema→UI）: `docs/frontend/ui-data-mapping.md`（担当: Codex）
- [x] CSVエクスポート仕様書（列/型/例）: `docs/frontend/csv-export-spec.md`（担当: Codex）
- [ ] キーボード操作一覧とアクセシビリティ方針の明文化（担当: Codex）
