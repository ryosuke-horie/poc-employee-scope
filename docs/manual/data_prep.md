# データ準備手順（companies.csv / urls.csv）

Playwrightでの取得対象URLは人手で用意します。以下のCSVをUTF-8（BOMなし）で作成してください。

## 1) companies.csv（企業マスター）
- パス: `data/companies.csv`
- 列定義:
  - `id`: 数値ID（1始まり、ユニーク）
  - `name`: 企業正式名称
- 例:
```
id,name
1,Acme Corporation
2,Foo Holdings
```

## 2) urls.csv（候補URL一覧）
- パス: `data/urls.csv`
- 列定義:
  - `company_id`: `companies.csv` の `id` に一致
  - `url`: 取得対象URL（https:// から始まる）
  - `source_type`: official|ir|wiki|news などの区分
  - `priority`: 1が最優先の整数（小さいほど先に取得）
- 例:
```
company_id,url,source_type,priority
1,https://www.acme.co.jp/company/profile,official,1
1,https://ja.wikipedia.org/wiki/Acme,wiki,9
2,https://www.foo-hd.co.jp/ir,ir,2
```

## 運用ルール
- URLは可能ならリダイレクト後の正規URLで記載
- 1社に複数URLを許容。`priority` で探索順序を制御
- 欠損がある企業はスキップ扱い（後日URLを補完）

## 作業チェックリスト
- [ ] `data/companies.csv` を作成/更新した
- [ ] `data/urls.csv` を作成/更新した
- [ ] CSVのヘッダ・文字コード（UTF-8/BOMなし）を確認した
