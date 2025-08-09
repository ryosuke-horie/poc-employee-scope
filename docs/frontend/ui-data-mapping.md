# UIデータマッピング（schema→UI）

目的: `review.json` のスキーマ項目をフロントエンドUIの表示/編集要素にマッピングし、null/未定義の扱いと代表evidence選定ルールを明確化する。

参照:
- スキーマ: ../schemas/review.schema.json
- 要件: ../../tasks-frontend.md

## companies
- id: ルーティングパラメータに利用（例: `/company/[id]`）。整数、1以上。
- name: 一覧/詳細での企業名表示、CSV出力の `company_name` に使用。

## evidence（一覧/詳細のサマリ表示に利用）
- company_id: 企業紐付け。代表evidence選定時のグルーピングキー。
- value: 抽出従業員数。null容認（未抽出/失敗）。
- raw_text: 抜粋（snippet）。詳細カードの本文に表示（長文は折りたたみ）。
- source_url: 外部リンク。新規タブで開く。
- source_type: フィルタに使用（official/ir/pdf/gov/wiki/news/agg/web/api/manual）。
- page_title: タイトル表示（nullならドメイン名などで代替）。
- status_code: HTTPステータス表示（任意）。
- score: 信頼度表示/並び替え/フィルタに使用（0.0〜1.0、null容認）。
- model: 抽出手段の表示（regex/llm/none など）。
- snippet_start/snippet_end: 抜粋位置（表示には直接使用せず、内部参照）。
- extracted_at: 取得日時の表示/並び替えに使用。

代表evidence選定（一覧に表示する1件）:
- 前提: 同一 `company_id` の evidence 群から1件選ぶ。
- ルール（優先順）:
  1) `value != null` を優先
  2) `score` 降順
  3) `extracted_at` 降順
  4) 同点の場合は `source_type` の優先度（official > ir > pdf > gov > wiki > news > agg > web > api > manual）

## review_state（編集対象）
- company_id: 企業紐付け。companiesの `id` と一致必須。
- decision: ok|ng|unknown。必須。UIのラジオ/セグメント入力で編集。
- override_value: number|null。値の上書き。未設定はnull。
- note: string|null。自由記述メモ。
- decided_at: string|null（ISO 8601）。UI保存時に付与。

## null/未定義の扱い
- value/score/page_title/status_code 等: 表示時は `—` などのダミー表現に置換し、ツールチップで「未取得/不明」を示す。
- override_value/note: 空欄→nullとして保存。
- decision: 必須。未選択時は `unknown`。

## ルーティング/状態保持
- 一覧: フィルタ/ソート/ページングをURLクエリに反映（共有可能）。
- 詳細: `/company/[id]` に遷移。戻る/進むでフィルタ状態を保持。
- 未保存ガード: 変更検知で遷移/閉じる警告を表示。

## CSVエクスポートとの関係
- 最終CSVは CLI の `export --final` と列定義・意味を一致させる（詳細は csv-export-spec.md）。

