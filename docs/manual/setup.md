# セットアップ手順（OpenRouter + Playwright）

本PoCは OpenRouter を使用し、URL取得は固定リスト＋Playwrightで行います。以下の手順に従って設定してください。

## 1. OpenRouter の設定
1. [OpenRouter](https://openrouter.ai/) にサインアップ
2. Dashboard → API Keys からキー発行
3. プロジェクトルートに `.env` を作成し、次を設定:

```ini
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxx
OPENROUTER_MODEL_ID=meta-llama/llama-3.1-8b-instruct
```

## 2. 固定URLリストの準備
- `companies.csv` に企業名を記載し、各企業に対応する候補URLは別途（例: `data/urls.csv`）で管理してください（後続のCLIオプションで指定予定）。
- Google等の検索APIは使用しません。必要に応じて人手でURLを補完してください。

## 3. 動作確認（実装後）
```bash
npm run build
npm start -- companies.csv
```

## トラブルシューティング
- OpenRouter: APIキーが正しいか、レート制限に達していないか確認してください。
EOF < /dev/null
