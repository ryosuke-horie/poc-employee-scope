# CSVエクスポート仕様（フロントエンド）

目的: フロントエンドから出力するCSVの列・型・意味を定義し、CLIの最終CSV（`export --final`）と整合させる。

参照:
- スキーマ: ../schemas/review.schema.json
- 要件: ../../tasks-frontend.md
- CLI最終CSVの現行列（exporter.ts）

## スコープ
- 対象: レビュー済みデータのCSV出力（UI → ダウンロード）。
- 原則: 列定義・意味は CLI の `export --final` と一致させる。

## 列定義（標準）
- company_name: string — 企業名（companies.name）
- employee_count: number|null — 最終値（override優先→evidence最良）
- decision: string — ok|ng|unknown（review_state.decision）
- note: string — レビューメモ（review_state.note）
- source_url: string — 採用evidenceのURL（最良候補）
- confidence_score: number — 採用evidenceのscore（0.0〜1.0）
- extraction_method: string — 採用evidenceの抽出手段（regex/llm/none）
- extracted_at: string — 採用evidenceの日時（ISOもしくは既存フォーマット）

備考:
- 最終値の決定: review_state.override_value が非nullならそれを採用。なければ、value!=null のevidenceから score 降順→extracted_at 降順で最良を採用。
- CLIとの整合を優先（列順・列名）。必要な追加列は拡張版として別途定義。

## 列定義（拡張オプション・任意）
- company_id: number — 企業ID（共有/連携向け）
- override_value: number|null — 上書き値（追跡用）
- final_value: number|null — 表示上の最終値（employee_countと同義）
- decided_at: string — 決定時刻（ISO 8601）

注意: 標準CSVには含めない（既定OFF）。UIの設定で「拡張列を含める」をONにした場合のみ出力。

## 形式
- 文字コード: UTF-8（BOMなし）
- 区切り: カンマ（","）
- 改行: LF（"\n"）
- 数値: 小数点はドット（"."）。nullは空欄。

## 並び順
- 行: company_id 昇順（IDがない場合は company_name 昇順）
- 列: 上記定義の順序

## 例（標準）
```
company_name,employee_count,decision,note,source_url,confidence_score,extraction_method,extracted_at
テスト企業,1200,ok,,https://example.com/profile,0.92,regex,2025-08-09 12:34:56
```

## 検証
- CLIの `npm run start:extended -- export --final` で出力したCSVとヘッダ/型/意味が一致すること。
- UI側のエクスポートはレビュー済みのみ（decision!=unknown）に限定可能（仕様オプション）。

## 今後の拡張
- 列のローカライズ（ヘッダ日本語/英語切替）
- TSVやExcel出力（将来）

