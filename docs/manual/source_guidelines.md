# URL候補選定ガイドライン（信頼度・優先度）

目的: 企業ごとに従業員数を取得できる可能性が高いURLを2〜5件用意し、`data/urls.csv` に記載します。各URLには信頼度に基づいた `priority`（小さいほど先）を付与します。

## 信頼度の序列（推奨）
1. 公式サイトの会社概要/コーポレートプロフィール/採用ページ（従業員数の明記）
2. 公式IR/統合報告書/有価証券報告書（PDF含む）
3. 官公庁・公的機関の登録情報（商業登記情報、統計）
4. Wikipedia（出典付き）
5. 大手ニュースサイト（一次情報に近いもの）
6. 企業情報まとめサイト（最終手段・参考程度）

## priority の付け方（例）
- 1: 公式の会社概要/IRなど一次情報
- 2〜3: 公式PDF（統合報告書など）、公的機関
- 5: Wikipedia
- 7: ニュース（一次情報に近い）
- 9: まとめサイト等

## `data/urls.csv` の書式
- 列: `company_id,url,source_type,priority`
- `source_type` は `official|ir|pdf|gov|wiki|news|agg` 等から選択
- 例:
```
company_id,url,source_type,priority
1,https://example.co.jp/company/profile,official,1
1,https://example.co.jp/ir/library/integrated-report.pdf,pdf,2
1,https://ja.wikipedia.org/wiki/Example,wiki,5
```

## 典型的な探し方（人手）
- 公式サイト内のパターン（日本語）: `会社情報`, `会社概要`, `企業情報`, `IR`, `採用情報`, `統合報告書`
- 英語サイト: `about`, `company`, `corporate`, `ir`, `investors`, `sustainability report`
- PDF内検索: `従業員`, `Employees`, `人員`, `連結従業員数`
- Wikipedia: 企業名 + `Wikipedia`（出典が明確か確認）

## 記載ルール
- URLはリダイレクト後の正規URLを推奨
- 同一サイト内で重複する情報は優先度の高い方のみ残す
- 従業員数が見つかる見込みが低いトップページのみの登録は避け、可能であれば関連下層ページも追加

## チェックリスト
- [ ] 各社2〜5個のURLを登録した
- [ ] `priority` を基準に沿って設定した
- [ ] `source_type` を適切に分類した
- [ ] 公式/一次情報を最優先に並べた
