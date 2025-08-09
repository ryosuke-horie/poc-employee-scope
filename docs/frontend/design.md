# フロントエンド設計（Next.js + Tailwind）

目的: 抽出済みの証跡（evidence）を人が確認し、OK/NG/不明の判断と上書き値・メモを保存する。

## 技術スタック
- Next.js 14（App Router）+ TypeScript
- Tailwind CSS（任意で daisyUI）
- AJV による `docs/schemas/review.schema.json` 検証

## 画面
- 一覧（`/`）: 企業別に最新のevidence概要を表示。検索/フィルタ（状態、信頼度、抽出方法）
- 詳細（`/company/[id]`）: 証跡カード（URL/タイトル/抜粋/スコア/日時/方法）。OK/NG/不明、値上書き、メモ保存。

## データ流通
- 入力: `review.json`（companies/evidence/review_state）
  - 読み込み: `public/review.json`（静的）または `GET /api/review`
- 保存:
  - JSONダウンロード（`review.json`）
  - または `POST /api/review`（ローカルに保存）
- スキーマ: `docs/schemas/review.schema.json`。AJVで検証し、エラーはUIに表示。

## コンポーネント（例）
- EvidenceCard: タイトル・抜粋・リンク・メタ情報
- DecisionControls: OK/NG/不明、上書き値、メモ
- Filters: 状態・信頼度・抽出方法などのフィルタ
- Toolbar: 保存/ダウンロード/インポート

## 状態管理
- 軽量なローカル状態（Context or Zustand）
- 変更はローカルで保持し、保存時にAJV通過後に出力
- 未保存変更の警告（Unloadガード）

## 連携ワークフロー
1) CLI: `poc bundle` → `output/review/review.json` 生成
2) Frontend: `public/review.json` へコピー or API経由で読込
3) UIでレビュー→保存（ダウンロード or POST）
4) CLI: `poc import --review path/to/review.json` → `export --final`

## セキュリティ/運用
- ローカル前提。外部送信なし。
- API Routeはローカルのみで動作し、CORSを閉じる。
- 秘密情報は扱わない。
