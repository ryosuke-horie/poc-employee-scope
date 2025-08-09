# 人手セットアップ手順（LLM/検索API）

本PoCを動かすための人手作業をまとめた手順書です。実施後は `.env` を保存し、機密情報は共有しないでください。

## 1. OpenRouter（クラウドLLM）
- アカウント作成: https://openrouter.ai/
- APIキー発行: Dashboard → API Keys → 新規発行
- `.env` へ追記:
  ```ini
  LLM_PROVIDER=openrouter
  OPENROUTER_API_KEY=sk-... # あなたのキー
  OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
  ```
- 備考: 利用料金/レートを確認。社外送信を避ける場合は Ollama を選択。

## 2. Ollama（ローカルLLM）
- インストール: https://ollama.com/ から OS に合わせて導入
- モデル取得（例）:
  ```bash
  ollama pull llama3.1:8b
  # 代替: ollama pull qwen2:7b
  ```
- `.env` へ追記:
  ```ini
  LLM_PROVIDER=ollama
  OLLAMA_MODEL=llama3.1:8b
  ```
- 備考: オフライン動作可。初回ダウンロードに時間/容量が必要。

## 3. SerpApi（任意・検索API）
- アカウント作成: https://serpapi.com/
- APIキー取得後、`.env` へ追記:
  ```ini
  SERPAPI_KEY=your-serpapi-key
  ```
- 備考: 無料枠/制限を確認。未使用の場合は固定URL運用で代替。

## 4. .env の管理
- 例（`.env.example` にも反映予定）:
  ```ini
  # いずれかを選択
  LLM_PROVIDER=openrouter
  OPENROUTER_API_KEY=sk-...
  OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
  
  # または
  # LLM_PROVIDER=ollama
  # OLLAMA_MODEL=llama3.1:8b
  
  # 任意
  SERPAPI_KEY=...
  ```
- `.env` はコミット禁止。必要なら開発メンバーに個別配布。

## 5. 動作確認（後日実装後に実施）
- 実装完了後、以下を実行予定:
  ```bash
  npm run build
  npm start -- companies.csv
  ```
- 期待値: 従業員数の抽出結果と出典が `SQLite/CSV` に保存される。
