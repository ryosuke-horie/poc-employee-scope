# タスク一覧（PoC進行用）

本リポジトリの `docs/requirements.md`／`docs/design.md`／`docs/technical_design.md` を基に、実装タスクをチェックリスト化しました。担当は原則として「仕様/進行: Codex」「実装: Claude」です。各タスクは完了時にコミットしてください（1プロンプト=1コミット推奨）。

## フェーズ0: 初期セットアップ
- [x] 仕様確認とタスク分割の承認（担当: Codex 完了）
- [x] Node.js 18+ とパッケージ管理（npm）準備（担当: Claude）
- [x] プロジェクト初期化（`package.json`, `tsconfig.json`, ESLint/Prettier 任意）（担当: Claude）

## フェーズ1: ディレクトリ/環境構築
- [x] ディレクトリ作成: `src/`, `tests/`（担当: Claude）
- [x] 環境変数定義と`.env.example`作成（担当: Codex）
- [x] `dotenv` 読み込みの雛形実装（担当: Claude）

## フェーズH: 人手セットアップ（手順は `docs/manual/setup.md`）
- [x] OpenRouter アカウント作成と API キー取得（担当: ユーザー）
- [x] `.env` に `OPENROUTER_API_KEY`, `OPENROUTER_MODEL_ID` を設定（担当: ユーザー）

## フェーズ2: 入出力とDB
- [ ] CSV入力（企業名リスト）処理 `src/index.ts` 基盤（担当: Claude）
- [ ] SQLite 層 `src/db.ts`（スキーマ・接続・INSERT/SELECT）（担当: Claude）
- [ ] CSVエクスポート機能（確認用出力）（担当: Claude）

## フェーズ3: 収集・取得
- [ ] 固定URL対応（入力/設定でURLを受け取る）（担当: Claude）
- [ ] ページ取得 `src/fetcher.ts`（Playwright）（担当: Claude）
- [ ] 取得リトライ/タイムアウト/ユーザーエージェント設定（担当: Claude）

## フェーズ4: 抽出
- [ ] 正規表現抽出 `src/extractor_regex.ts`（日本語/英語パターン）（担当: Claude）
- [ ] LLM抽出: OpenRouter `src/extractor_llm_openrouter.ts`（STRICT JSON 返却）（担当: Claude）
- [ ] LLM呼出の前処理（テキスト短縮・最大トークン管理）（担当: Claude）

## フェーズ5: 連携・保存・確認
- [ ] 出典URL/抜粋の保存（`evidence` テーブル）（担当: Claude）
- [ ] CLI オプション（入力CSVパス、出力形式）（担当: Claude）
- [ ] 並列処理とキュー制御（40〜50社/時以内目標）（担当: Claude）

## フェーズ6: エラー処理・コスト最適化
- [ ] 例外/スキップ/ログ方針（regex成功時はLLMスキップ）（担当: Claude）
- [ ] レート制御・バックオフ（API利用時）（担当: Claude）

## フェーズ7: テストとデモ
- [ ] 単体テスト雛形（入出力、正規表現、JSONパース）（担当: Claude）
- [ ] サンプル `companies.csv` とデモ実行手順の追記（担当: Codex）
- [ ] 結果検証フロー（CSV/SQLiteビューワ）（担当: Codex）

## フェーズ8: ドキュメント/運用
- [ ] `README.md` に実行手順・環境変数・例を追記（担当: Codex）
- [ ] 重要決定の追記（`docs/technical_design.md` ADR的記録）（担当: Codex）
- [ ] PR テンプレート/コミット規約の整備（担当: Codex）

### 実行例（参考）
```bash
OPENROUTER_API_KEY=sk-xxx npm run start -- companies.csv
```
