# セットアップ手順

## 1. 環境変数の設定

プロジェクトルートに `.env` ファイルを作成し、必要な環境変数を設定してください。

```bash
cp .env.example .env
```

## 2. LLMプロバイダーの選択と設定

### OpenRouter を使用する場合

1. [OpenRouter](https://openrouter.ai/) にアクセスしてアカウントを作成
2. APIキーを取得
3. `.env` ファイルに以下を設定:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxx
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
```

### Ollama を使用する場合（ローカル実行）

1. [Ollama](https://ollama.ai/) をインストール:
   - macOS: `brew install ollama`
   - その他: 公式サイトからダウンロード

2. モデルをダウンロード:
```bash
ollama pull llama3.1:8b
```

3. Ollamaサーバーを起動:
```bash
ollama serve
```

4. `.env` ファイルに以下を設定:
```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434
```

## 3. SerpApi の設定（任意）

検索APIを使用する場合:

1. [SerpApi](https://serpapi.com/) でアカウントを作成
2. APIキーを取得
3. `.env` に追加:

```env
SERPAPI_KEY=xxxxxxxxxxxxxxxxxx
```

※SerpApiを使用しない場合は、固定URLリストから情報を取得します。

## 4. 動作確認

設定が完了したら、以下のコマンドで動作確認できます:

```bash
# ビルド
npm run build

# 実行
npm run start
```

## トラブルシューティング

### OpenRouter APIキーエラー
- APIキーが正しく設定されているか確認
- APIキーの先頭に `sk-or-v1-` が含まれているか確認

### Ollama接続エラー
- Ollamaサーバーが起動しているか確認: `ollama list`
- ポート11434が使用可能か確認
- ファイアウォールの設定を確認

### SerpApiエラー
- APIキーが正しいか確認
- 無料プランの場合、月間クエリ数の制限を確認
EOF < /dev/null