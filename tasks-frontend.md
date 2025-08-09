# タスク（フロントエンド・レビューUI）

目的: 人が抽出済みの証跡を確認し、「OK/NG/不明」を判断、必要に応じて上書き値とメモを残し、ローカルで保存できるUIを提供する。

参考: 設計は `docs/frontend/design.md`、スキーマは `docs/schemas/review.schema.json`、運用は `docs/manual/review_workflow.md` を参照。

## スコープ
- 対象: `poc bundle` が生成する `review.json` を入力として、人手レビューを行うローカルUI。
- 対応範囲: 一覧/詳細/編集/保存/エクスポート、検索・フィルタ、スキーマ検証、未保存ガード。
- 出力: 上書き含む `review_state` を含んだ `review.json`（スキーマ準拠）。

## 非スコープ
- 外部公開/ホスティング、アカウント管理、多人数同時編集、非ローカル保存先。
- スクレイピングや抽出精度の改善、モデル推論の実行。
- 監査ログや操作履歴の長期保存（必要時は別途要件化）。

## ペルソナ
- リサーチ担当: 証跡の妥当性確認と最終決定を行う。操作はシンプルでショートカット志向。
- 監修者: 例外時のルール確認、レビュー完了のチェックのみ行う。

## 主要ユースケース（ユーザーストーリー）
- 研究者として、特定企業の証跡を一括で確認し、OK/NG/不明と上書き値/メモを保存したい。
- 研究者として、信頼度の高い証跡のみを絞り込みたい（score、source_type）。
- 研究者として、未判定やエラーのみを抽出して効率よく消化したい。
- 監修者として、レビュー完了件数と未保存件数を把握したい。

## 画面要件
- 一覧
  - 企業ごとの最新 evidence 概要と現在の決定（review_state）を表示。
  - 検索・フィルタ: 決定状態（ok/ng/unknown）、score 範囲、source_type、抽出方法、エラー有無、未判定のみ。
  - 並び替え: 会社名、score、更新日時。
- 詳細
  - 証跡カード: URL、タイトル、抜粋（raw_textの該当部）、score、source_type、取得日時、抽出方法、HTTP ステータス。
  - 決定入力: decision（ok/ng/unknown）、override_value（任意）、note（任意）。
  - 外部リンクは新規タブで開く。抜粋は周辺文脈を含み可読性を担保。
- 共通
  - 変更が未保存の場合、遷移・ウィンドウクローズ時に警告。
  - 保存・ダウンロード・インポートの操作をツールバーに集約。

## データ I/F 要件
- 入力: `review.json`（`docs/schemas/review.schema.json` に準拠）
  - required: `generated_at`, `companies[]`, `evidence[]`, `review_state[]`
  - evidence 主な属性: `company_id`, `source_url`, `raw_text`, `score`, `source_type`, `extracted_at`
  - review_state 主な属性: `company_id`, `decision (ok|ng|unknown)`, `override_value?`, `note?`, `decided_at?`
- 読み込み経路
  - 静的: `public/review.json`
  - API: `GET /api/review`
- 保存経路
  - ダウンロード: 加工済み `review.json` をクライアントから保存
  - API: `POST /api/review`（ローカルのみ）。受領後の保管先はローカルに限定。
- バリデーション
  - `ajv` によるスキーマ検証。エラーはユーザーに可視化（項目名・位置・要約）。

## 機能要件
- 検索/フィルタ/ソート: 前述の条件で即時反映。状態はURLクエリで共有可能。
- 編集: decision/override_value/note の編集と取り消し（1段階 undo）。
- 保存: 現在の `review_state` を上書き反映して出力。`decided_at` を ISO 8601 で付与。
- エクスポート: レビュー済みのみを CSV に変換（companies + 最終決定）。CLI の最終出力と一致。
- 差分ハイライト（任意）: 直前 bundle との差分が大きい企業を一覧で強調。

## 非機能要件
- パフォーマンス: 1,000 社 / 10,000 evidence 規模でも 2 秒以内で一覧描画、詳細遷移は 1 秒以内（ローカル想定）。
- UX: キーボードショートカット（例: 1=ok, 2=ng, 3=unknown, s=保存）。
- 可用性: オフラインで動作。ネットワーク未接続でも JSON ダウンロードは可能。
- セキュリティ: ローカル限定で外部送信なし。API Route は CORS 無効、同一オリジンのみ。

## エラー/例外ハンドリング
- スキーマ不一致: 読み込み時に詳細を表示し、読み込みを中断。サンプル JSON へのリンクを提示。
- 破損/空ファイル: 明示エラーとリトライ動線。
- 保存失敗（API）: HTTP ステータスと理由を表示。再試行と JSON ダウンロードの代替を提示。

## 技術選定
- Next.js 14 App Router（`app/`）+ TypeScript + Tailwind CSS（必要に応じて daisyUI）。
- 状態管理: 軽量（Context or Zustand）。
- バリデーション: `ajv` による `docs/schemas/review.schema.json` 検証。

## 連携フロー（要約）
1) CLI: `poc bundle` → `output/review/review.json` 生成
2) Frontend: `public/review.json` に配置 or `GET /api/review`
3) UI でレビュー→保存（ダウンロード or `POST /api/review`）
4) CLI: `poc import --review path/to/review.json` → `export --final`

## 受入基準
- スキーマ適合: 読み込み時に `docs/schemas/review.schema.json` の検証に合格する。
- 基本フロー: 一覧/詳細/編集/保存がローカルのみで完結する。
- 整合性: エクスポート CSV が CLI の `export --final` と一致する（同一入力前提）。
- 操作性: 未保存ガードとショートカットが動作し、誤操作が抑制される。

## マイルストーン
- M1: 静的読み込み + 一覧/詳細表示 + JSON ダウンロード保存
- M2: 検索・フィルタ・ソート + スキーマ検証 + 未保存ガード
- M3: API 経由の入出力（ローカル限定） + CSV エクスポート
- M4: 使い勝手調整（ショートカット/差分ハイライト/パフォーマンス）

## レビュー観点
- スキーマ遵守・I/F 一貫性、ローカル完結性、誤操作防止、パフォーマンス（目安値）、UI の可読性。

## 備考
- 実装詳細は `docs/frontend/design.md` に集約。追加要件は本要件書に追記し、設計へリンクを張る。
