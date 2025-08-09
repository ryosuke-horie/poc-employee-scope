# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

40〜50社の対象企業から従業員数情報を自動収集するPoC（概念実証）システム。Webスクレイピングと LLM抽出を使用し、クラウドインフラを使わずローカルで動作。人間による検証のため、必ず出典情報を提供する。

## 技術スタック

- **言語**: TypeScript (Node.js 22+)
- **データベース**: SQLite (better-sqlite3)
- **スクレイピング**: Playwright
- **HTMLパース**: cheerio
- **LLM連携**:
  - OpenRouter API (例: meta-llama/llama-3.1-8b-instruct)
  - Ollama (ローカル, 例: llama3.1:8b, qwen2:7b)
- **検索API**: SerpApi (任意)
- **環境変数管理**: dotenv

## 主要コマンド

```bash
# 依存関係のインストール
npm install

# OpenRouterで実行
LLM_PROVIDER=openrouter OPENROUTER_API_KEY=sk-xxx npm run start

# ローカルのOllamaで実行
LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.1:8b npm run start

# TypeScriptのコンパイル
npm run build

# 開発モード（設定されている場合）
npm run dev
```

## アーキテクチャ

パイプライン型アーキテクチャを採用：

1. **入力**: CSVから企業名を読み込み
2. **URL収集**: SerpApiまたは事前定義URLで関連ページを検索
3. **ページ取得**: Playwrightで動的コンテンツに対応
4. **抽出**: 
   - まず正規表現パターンで試行
   - 失敗時はLLMにフォールバック
5. **保存**: 出典付きでSQLiteに保存
6. **確認**: 人間による確認のためCSVエクスポート

## データベーススキーマ

```sql
CREATE TABLE companies(
  id INTEGER PRIMARY KEY, 
  name TEXT UNIQUE
);

CREATE TABLE candidates(
  id INTEGER PRIMARY KEY,
  company_id INTEGER,
  value INTEGER,
  raw_text TEXT,
  source_url TEXT,
  source_type TEXT,
  source_date TEXT,
  score REAL,
  model TEXT,
  extracted_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 主要モジュール

- `index.ts` - エントリーポイント
- `db.ts` - SQLite操作
- `serp.ts` - SerpApi連携（URL探索）
- `fetcher.ts` - Playwright によるページ取得
- `extractor_regex.ts` - 正規表現による抽出
- `extractor_llm_openrouter.ts` - OpenRouter LLM抽出
- `extractor_llm_ollama.ts` - Ollama ローカルLLM抽出
- `utils.ts` - 共通ユーティリティ

## 環境変数

`.env`ファイルに以下を設定：
```
LLM_PROVIDER=openrouter|ollama
OPENROUTER_API_KEY=...
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
OLLAMA_MODEL=llama3.1:8b
SERPAPI_KEY=... # 任意
```

## 抽出戦略

1. 効率化のため、まず正規表現パターンを使用：
   - `/従業員数[:：\s]*([\d,]+)\s*名?/i`
   - `/Employees[:：\s]*([\d,]+)/i`
2. 正規表現が失敗した場合のみLLMを呼び出し（コスト最適化）
3. 検証用に必ず出典URLと抽出テキストを保存
4. LLMレスポンスは厳密なJSON形式で取得

## 重要な制約事項

- ウェブサイトの利用規約とrobots.txtを遵守
- 公開情報のみを使用
- すべてのLLM出力は人間による確認が必要
- 正規表現抽出を優先してAPIコストを最小化
- エラー時は適切にフォールバック処理を実行

## 日本語での回答について

このプロジェクトで作業する際は、すべての回答とドキュメントを日本語で提供してください。

## 自動コミットルール

ユーザーからのリクエストを実装・対応した場合は、作業完了後に必ず以下を実行してください：

1. 実装した内容を簡潔に要約したコミットメッセージを作成
2. 変更内容を自動的にgitコミット
3. コミットメッセージは日本語で、何を実装・変更したかを明確に記載

例：
- "従業員数抽出機能の実装"
- "正規表現パターンの追加"
- "エラーハンドリングの改善"

注意：ユーザーが明示的にコミットを拒否した場合は除く。

## 役割分担について

### Codexエージェントの役割
- **PDM（Product Development Management）**: プロダクト開発の管理と計画
- **表現定義**: 仕様や要件の言語化と文書化
- **進行管理**: タスクの優先順位付けと進捗管理

### Claude（あなた）の役割
- **実装**: 実際のソースコード生成
- **コーディング**: 機能の実装とバグ修正
- **技術的実現**: Codexが定義した仕様の技術的な実装

Codexエージェントから仕様や要件が提示された場合は、その内容に基づいて実装を行ってください。Codexは「何を作るか」を決め、Claudeは「どう作るか」を実現します。

## テストに関するルール

### テスト作成の原則
1. **スキップするテストは作らない**: `it.skip()` や `test.skip()` を使用しない
2. **実装済み機能のみテストする**: 未実装機能のテストは書かない
3. **環境依存のテストは避ける**: 
   - ネットワークアクセスが必要なテスト
   - 外部サービスに依存するテスト
   - タイマーやタイムアウトに強く依存するテスト
4. **削除を優先**: 動作しないテストや不安定なテストは修正より削除を選択

### テストの品質
- **確実に動作するテストのみ**: 常に成功するテストケースを作成
- **モックの活用**: 外部依存はモックで代替
- **単体テストに集中**: 統合テストは別途検討
- **明確な期待値**: 実装の仕様に基づいた正確な期待値を設定