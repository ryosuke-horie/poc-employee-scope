# タスク（CLI・バックエンド）

CLIで収集/抽出/保存/エクスポートを担う。OpenRouter専用・Playwright取得方針に沿って、人手確認のための証跡を出力できる形に整える。

## 0. 整合性の是正
- [ ] config から Ollama/SerpApi 設定を削除（OpenRouter専用に統一）
- [ ] `.env.example` の整理（OPENROUTER_* のみ）
- [ ] コード/ログ文言の整合（ドキュメントと一致）

## 1. 取得と抽出の強化
- [ ] Playwright のUA/タイムアウト/リトライ設定を環境変数で調整可能に
- [ ] 抽出スニペット: マッチ周辺の前後 N 文字を保持（レビューで根拠を確認しやすく）
- [ ] priority 順フォールバックの明示ログ（どのURLで成功/失敗か）

## 2. 証跡（evidence）の拡充
- [ ] evidence にフィールド追加（例: snippet_range, page_title, status_code, fetched_at）
- [ ] source_type の語彙統一（official|ir|pdf|gov|wiki|news|agg）
- [ ] 失敗時にも最終試行URLとエラー要約を保存

## 3. エクスポート/レビュー用出力
- [ ] `poc export --format csv` 既存の整備（列定義の固定化）
- [ ] `poc export --format json`（frontend向け）: companies, evidence 配列を出力
- [ ] `poc bundle --out output/review/` で review.json と最小の静的アセットを生成

## 4. レビュー状態の管理
- [ ] review_state テーブル（company_id, decision(ok/ng/unknown), decided_at, note, override_value）
- [ ] CLI からレビュー結果の import/export（JSON/CSV）
- [ ] エクスポート時にレビュー済みフィルタ/統合（最終値の決定）

## 5. 運用補助
- [ ] `data/urls.csv` の検証（同一URL重複/無効ドメインの検出）
- [ ] gemini 提案結果の整形ヘルパー（CSV→正規化）
- [ ] ログのファイル出力（`output/logs/`）とレベル切替

## 6. ドキュメント
- [ ] `docs/manual/review_workflow.md` 作成（CLI→bundle→フロントエンド確認の流れ）
- [ ] README のCLI章更新（使い方例、オプション一覧）
