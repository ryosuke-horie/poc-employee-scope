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
  
### TODO（フィルタ仕様・並び替え詳細）
- [ ] 状態フィルタ: ok/ng/unknown/未判定のみ（複数選択可・デフォルト=全て）
- [ ] scoreフィルタ: 下限/上限スライダー（0.0〜1.0、刻み0.05、デフォルト=全域）
- [ ] source_type: チェックボックス群（official/ir/pdf/gov/wiki/news/agg/web/api/manual）
- [ ] 方法フィルタ: extraction_method（regex/llm/failed）
- [ ] 失敗のみ: value=null またはエラー有のevidence優先を抽出
- [ ] 並び替え優先: 決定状態→score降順→更新日時降順（デフォルト）

### TODO（ナビゲーション/ルーティング）
- [ ] URLクエリでフィルタ/ソート/ページング状態を保持（共有可能）
- [ ] 企業詳細の深いリンク（`/company/[id]`）でブラウザ戻る/進むと状態維持
- [ ] 選択企業のハイライトとキーボード移動（↑/↓で次/前へ）

## TODO（データ I/F）
- [ ] 入力: `review.json` を読み込み（required: generated_at, companies[], evidence[], review_state[]）
- [ ] 読み込み経路: `public/review.json` または `GET /api/review`
- [ ] 保存経路: JSON ダウンロード または `POST /api/review`（ローカル限定）
- [ ] バリデーション: `ajv` によるスキーマ検証（エラー可視化）
  
### TODO（データマッピング・整合性）
- [ ] UIモデル←→スキーマのマッピング表を作成（company/evidence/review_state）
- [ ] null/未定義の扱いを定義（override_value/note/score等）
- [ ] evidenceの最新/代表選定ロジック（score降順/時刻/優先source_type）
- [ ] `decided_at` は保存時にクライアントで付与（ISO 8601）
- [ ] JSONインポート: `<input type="file">` から `review.json` を読み込み可能に（ドラッグ&ドロップ対応）

## TODO（機能）
- [ ] 検索/フィルタ/ソート（URLクエリで状態共有）
- [ ] 編集（decision/override_value/note）と 1 段階の Undo
- [ ] 保存時に `review_state` を更新し `decided_at` を ISO 8601 付与
- [ ] エクスポート: レビュー済みのみ CSV（companies + 最終決定）
- [ ] 差分ハイライト（任意、直前 bundle との比較）
  
### TODO（CSVエクスポート仕様）
- [ ] 列定義（固定）: company_id, company_name, decision, override_value, final_value, note, source_url, confidence_score, extraction_method, decided_at
- [ ] 並び順: company_id 昇順
- [ ] 文字コード: UTF-8（BOMなし）
- [ ] 小数/NULLの表現ルールを定義

### TODO（状態管理/保存）
- [ ] ローカルドラフト（localStorage）に自動保存（5秒おき・軽量差分）
- [ ] ドラフトの復元/破棄UI
- [ ] 未保存変更の件数表示（ヘッダーにアイコン）
- [ ] 変更履歴は1段階Undoのみ（再読み込みで破棄）

## TODO（非機能）
- [ ] パフォーマンス: 1,000 社/10,000 evidence で一覧 2s/詳細 1s 以内
- [ ] UX: キーボードショートカット（1=ok, 2=ng, 3=unknown, s=保存）
- [ ] 可用性: オフライン動作（ネット未接続でも保存可）
- [ ] セキュリティ: ローカル限定・外部送信なし、API は CORS 無効/同一オリジンのみ
  
### TODO（A11y/i18n/ブラウザ対応）
- [ ] A11y: フォーカス可視、ランドマーク/ラベル適切、コントラスト遵守
- [ ] A11y: エラーは `aria-live` で通知、キーボード操作可能
- [ ] i18n: 日本語既定、表示文字列を一元管理（英語切替は将来対応）
- [ ] ブラウザ: 最新 Chrome/Safari/Firefox で基本動作確認

## TODO（エラー/例外）
- [ ] スキーマ不一致時の詳細表示と読込中断、サンプル JSON への導線
- [ ] 破損/空ファイル時の明示エラーとリトライ動線
- [ ] 保存失敗（API）の理由表示・再試行・JSON ダウンロード代替
  
### TODO（エラーパターン詳細）
- [ ] ネットワーク不通（API読込/保存）: リトライ/オフライン保存誘導
- [ ] CORSブロック: エラーメッセージとローカル限定の注記
- [ ] JSON解析失敗/文字化け: ファイル情報と再読込導線
- [ ] 例外ハンドラ（Error Boundary）でUI崩壊を防止

## TODO（技術選定）
- [ ] Next.js 14 App Router + TypeScript + Tailwind（daisyUI 任意）
- [ ] 状態管理（Context または Zustand）
- [ ] AJV によるスキーマ検証の導入
  
### TODO（実装ガイド）
- [ ] ページ構成: `/` 一覧、`/company/[id]` 詳細
- [ ] コンポーネント粒度: EvidenceCard/DecisionControls/Filters/Toolbar
- [ ] 仮API: `/api/review` GET/POST（ローカル限定・CORS無効）
- [ ] スタイル: Tailwind基調、ダークモード任意（将来）

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
  
### TODO（受入シナリオの詳細）
- [ ] サンプル `review.json`（10社/100evidence相当）で一覧が2秒以内に描画
- [ ] フィルタ: unknownのみ + score>=0.8 + source_type=official で結果が即時反映
- [ ] 詳細で decision=ok + override=1234 + note 入力→保存→CSVに反映
- [ ] ブラウザ更新後もドラフト復元が可能（未保存時）
- [ ] JSON手動インポート→一覧/詳細に即時反映（AJV合格）

## TODO（マイルストーン）
- [ ] M1: 静的読込 + 一覧/詳細表示 + JSON ダウンロード保存
- [ ] M2: 検索/フィルタ/ソート + スキーマ検証 + 未保存ガード
- [ ] M3: API 入出力（ローカル）+ CSV エクスポート
- [ ] M4: 使い勝手調整（ショートカット/差分/パフォーマンス）
  
### TODO（成果物の明確化）
- [ ] M1 成果: `/public/review.json` 想定のスタブとUIワイヤーフレーム
- [ ] M2 成果: AJV検証ログとフィルタ仕様ドキュメント
- [ ] M3 成果: CSVサンプル（10行）とAPIモック
- [ ] M4 成果: パフォーマンス計測結果（Lighthouse or 手計測）

## TODO（ドキュメント/レビュー）
- [ ] `docs/frontend/design.md` と本 TODO の整合性を維持
- [ ] `docs/manual/review_workflow.md` に UI チェックリスト/スクショ追記
- [ ] レビュー観点（スキーマ遵守/ローカル完結/誤操作防止/性能/可読性）の合意
  
### TODO（追補ドキュメント）
- [ ] UIデータマッピング表（schema→UI）を `docs/frontend/` に追加
- [ ] CSVエクスポート仕様書（列/型/例）を `docs/frontend/` に追加
- [ ] キーボード操作一覧とアクセシビリティ方針の明文化
