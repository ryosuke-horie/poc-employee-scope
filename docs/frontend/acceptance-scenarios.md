# 受入シナリオ（フロントエンド・最小スコープ）

目的: 最小スコープにおける受入観点を具体的な確認手順として列挙する。

参照
- 仕様: `docs/frontend/design.md`
- TODO: `tasks-frontend.md`
- スキーマ: `docs/schemas/review.schema.json`

## シナリオ
- [ ] サンプル `review.json`（10社/100evidence相当）で一覧が2秒以内に描画
- [ ] フィルタ: unknownのみ + score>=0.8 + source_type=official で結果が即時反映
- [ ] 詳細で decision=ok + override=1234 + note 入力→保存→一覧・詳細に反映

備考
- AJV 検証は読込時と保存前の双方で実施。失敗時は描画/保存を中断し、上部バナーに要約を表示。
