# レビュー運用フロー（CLI ↔ フロントエンド）

本フローは、人手で証跡を確認し最終判断（OK/NG/不明・上書き値・メモ）を残すための運用を定義します。

## 1. CLIでバンドルを作成
```bash
npm run start -- --companies data/companies.csv --urls data/urls.csv
# 収集・抽出・DB保存の後、以下でレビュー用バンドル生成
poc bundle --out output/review/
# → output/review/review.json を生成（schemas/review.schema.json 準拠）
```

## 2. フロントエンドでレビュー
- `output/review/` の `index.html` をブラウザで開く
- 一覧→詳細で証跡（URL/タイトル/抜粋/スコア/日時）を確認
- 判定（OK/NG/不明）、必要なら値の上書きとメモを入力
- 保存は以下いずれか:
  - JSONダウンロード（review.json）
  - ローカルサーバに `POST /review`（選択式）

## 3. CLIで取り込み・最終出力
```bash
poc import --review path/to/review.json
poc export --final csv --out output/final.csv
```
- `review_state` をDBへ反映し、overrideを優先して最終CSVを出力

## 注意点
- review.json は `docs/schemas/review.schema.json` でバリデーション可能
- URLは新規タブで開く。証跡の抜粋（snippet）は判断根拠の周辺文脈を含む
- すべてローカルで完結。秘匿情報は含めない
