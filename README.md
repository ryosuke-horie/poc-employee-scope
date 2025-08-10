# poc-employee-scope

企業従業員数自動取得PoCの設計・仕様ドキュメントを管理するリポジトリです。

- 新規参加者は [docs/manual/onboarding.md](docs/manual/onboarding.md) を参照してください
- 詳細な要件と設計は [docs/](docs) 以下にまとめています

## CLI

ヘルプは次のコマンドで表示できます:

```bash
OPENROUTER_API_KEY=dummy npm run start -- --help
```

### 主なオプション

- `--companies <path>`: 企業リストCSVファイルのパス（デフォルト: `data/companies.csv`）
- `--urls <path>`: URLリストCSVファイルのパス（デフォルト: `data/urls.csv`）
- `--output <path>`: 結果出力先のパス（デフォルト: `output/results_[timestamp].csv`）
- `--parallel <num>`: 並列処理数（デフォルト: 3）

詳細は [docs/cli-commands.md](docs/cli-commands.md) を参照してください
