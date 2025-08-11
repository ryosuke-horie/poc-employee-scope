# 検証結果メモ（CLI）

目的: CLI 実行時の検証ログや観察結果を記録し、再現性のある振る舞い確認を補助する。

参照
- 仕様/TODO: `tasks-cli.md`
- コマンド一覧: `docs/cli-commands.md`

## 実施履歴
- 実施日時: 2025-08-09
  - ログ確認: `npm run dev:extended -- extract --parallel 1 --companies data/companies.csv --urls data/urls.csv`
    - 全URLで接続失敗（ERR_TUNNEL_CONNECTION_FAILED）したが開始/エラー理由/フォールバックが記録されURL単位で追跡可能
- 実施日時: 2025-08-10
- ヘルプ確認:
  - `npm run start -- --help`（従来版ヘルプ表示OK）
  - `npm run start:extended -- help`（拡張版ヘルプ表示OK）
- バンドル生成: `npm run start:extended -- bundle --output output/`
  - 生成物: `output/review/review.json`（companies:10, evidence:16, review_state:10）, `output/review/index.html`
  - 構造検証: 必須キー（generated_at/companies/evidence/review_state）存在を確認
- CSV出力: `npm run start:extended -- export --format csv --output output/export.csv`
  - 先頭行: `company_name,employee_count,source_url,source_text,extraction_method,confidence_score,extracted_at,page_title,status_code,error_message`
- 最終CSV（代替手順）: `npm run start:extended -- export --final --review output/review/review.json --output output/final.csv`
  - 動作: レビュー（unknown）を反映しつつ最良evidence情報を出力（import未実装のため代替）
- 実施日時: 2025-08-11
  - review_stateテーブル実装: PR #29でマージ完了
    - テーブル定義、CRUD操作（upsert/get/getAll/delete）実装済み
    - マイグレーションスクリプト（`npm run migrate`）実装済み
    - 単体テスト9ケース全て成功
  - export --final コマンド: 実装済み（exportFinalCSV関数）
    - レビュー結果JSONを読み込み、override_value優先で最終値を出力
  - import --review コマンド: 実装完了
    - `npm run start:extended -- import --review output/review/review.json` でインポート成功
    - 10件全てインポート（imported: 10, skipped: 0）
    - DBからレビュー状態を読み込んで export --final で反映確認
