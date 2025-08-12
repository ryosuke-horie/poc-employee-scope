# フロントエンド設計（Next.js + Tailwind）

目的: 抽出済みの証跡（evidence）を人が確認し、OK/NG/不明の判断と上書き値・メモを保存する。

前提/対象（本フェーズ最小）
- デスクトップ優先Web（レスポンシブ対応なし）、最新Chromeのみ対応。
- 言語は日本語のみ。
- データ規模は小さく、ページング/仮想スクロールなし。
- 保存は完全ローカル（暗号化不要）。エクスポート/インポートは対象外。

## 技術スタック
- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（任意で daisyUI）
- AJV による `docs/schemas/review.schema.json` 検証（読込時/保存前）

## 画面
- 一覧（`/`）: 企業別に最新のevidence概要を表示。検索/フィルタ（状態、信頼度、抽出方法）
- 詳細（`/company/[id]`）: 証跡カード（URL/タイトル/抜粋/スコア/日時/方法）。OK/NG/不明、値上書き、メモ保存。

状態表示（最小）
- ローディング/エンプティ/エラーのみ（トースト任意）。未保存ガードは対象外。

## データ流通
- 入力: `public/review.json`（静的ファイルとして読み込み）
- 保存: `localStorage` に単一キーで保存（キー例: `review_state_v1`、明示保存のみ／自動保存なし）
- スキーマ: `docs/schemas/review.schema.json` を正とし、フロントは `public/schemas/review.schema.json` を参照。AJVで検証し、エラーはUIに表示。

保存データの最小形（例）
```json
{
  "generated_at": "2025-08-09T12:34:56Z",
  "review_state": [
    { "company_id": 1, "decision": "ok", "override_value": 1234, "note": "", "decided_at": "2025-08-11T10:00:00Z" }
  ]
}
```

## コンポーネント（例）
- EvidenceCard: タイトル・抜粋・リンク・メタ情報
- DecisionControls: OK/NG/不明、上書き値、メモ
- Filters: 状態・信頼度・抽出方法などのフィルタ
- Toolbar: 保存のみ（ダウンロード/インポートは対象外）

## 状態管理
- React Context + useReducer（最小依存）
- 代表的なアクション: `loadData`, `setFilter`, `editDecision`, `saveLocal`, `restoreLocal`, `setSort`
- 変更はローカル状態に反映し、保存ボタンでAJV検証を通過した場合のみ `localStorage` に書き込み

## 検索/フィルタ/ソート仕様（最小）
- 状態フィルタ: ok/ng/unknown/未判定（複数選択可、既定=全選択）
- score フィルタ: 下限/上限スライダ（0.0〜1.0、刻み0.05、既定=全域）
- source_type: チェックボックス群（official/ir/pdf/gov/wiki/news/agg/web/api/manual）
- extraction_method: チェック（regex/llm/failed）
- 並び替え（任意）: 会社名（昇順）/score（降順）/更新日時（降順）のうち最低1種を実装。既定の優先度は「決定状態→score降順→更新日時降順」。
- URL共有: 詳細仕様・パラメータ命名は `docs/frontend/navigation-routing-spec.md` を参照（共有リンクの後方互換/安定化方針を含む）。

## ナビゲーション/ルーティング
- 一覧と詳細（`/` / `/company/[id]`）の状態維持・共有リンク・履歴操作については、`docs/frontend/navigation-routing-spec.md` に準拠する。

## 代表evidenceの選定（最小）
- value != null の evidence を対象に、score 降順 → extracted_at 降順で 1 件採用。
- UI表示の最終値は override_value が非 null の場合はそれを優先。

## バリデーション/エラー表示（最小）
- 読込時/保存前に AJV で検証。
- 失敗時は描画/保存を中断し、ページ上部にエラーバナー（件数＋先頭5件: `instancePath` と `message`）。詳細は `console.error`。

## 連携ワークフロー（最小）
1) CLI: `poc bundle` → `output/review/review.json` 生成
2) Frontend: `public/review.json` へ配置（静的読込）
3) UIでレビュー→保存（`localStorage` へ書込）

## セキュリティ/運用
- ローカル前提。外部送信なし。API 連携は行わない。
- 秘密情報は扱わない。
