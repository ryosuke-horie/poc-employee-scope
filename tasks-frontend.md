# タスク（フロントエンド・レビューUI）

目的: 人が証跡を見て「OK/NG/不明」を判断し、根拠リンクと抜粋テキストを確認・編集・保存できるローカルUIを提供する。

## 1. 要件定義
- [ ] 画面一覧を定義（一覧・詳細・検索/フィルタ）
- [ ] 最終決定フィールド（decision/override_value/note）の定義
- [ ] 既存DB/JSONとのI/F（読み込み・保存）を定義

## 2. データI/F
- [ ] 入力: `review.json`（companies/evidence/review_state）仕様を確定
- [ ] 保存: `POST /review` or JSONダウンロード（運用に合わせ選択）
- [ ] セキュアなローカル限定起動（ポート固定、CORS制限）

## 3. 画面/機能
- [ ] 一覧: 企業ごとの抽出結果・最終決定の一覧、検索/フィルタ（状態、信頼度、失敗のみ等）
- [ ] 詳細: 証跡（URL、タイトル、抜粋、抽出手段、スコア、日時）をカード表示、リンクは新規タブで開く
- [ ] 編集: OK/NG/不明の選択、値の上書き、メモ、保存
- [ ] 差分表示: 変更多発の企業のハイライト
- [ ] エクスポート: レビュー済みのみCSV出力（companies+最終決定）

## 4. 技術選定
- [ ] ローカル前提: Vite + React/Preact（またはSvelte）でSPAを構築
- [ ] 保存方式: 小さなExpressサーバでJSON保存 or ダウンロード→CLIで取り込み
- [ ] UIライブラリ: 最小限（素のCSS/小規模UIキット）

## 5. 連携フロー（人手）
- [ ] CLI: `poc bundle` 実行→ `output/review/` に review.json + 静的UI を生成
- [ ] ユーザー: ブラウザで `index.html` を開いて確認・判定
- [ ] 保存: JSONをダウンロード or ローカルサーバへPOST
- [ ] CLI: `poc import --review path/to/review.json` でDBに反映→CSV最終出力

## 6. ドキュメント
- [ ] `docs/manual/review_workflow.md` にUIの使い方・保存方法・制約を記載
- [ ] スクリーンショットとチェックリスト（全件レビューの確認）
