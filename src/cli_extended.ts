import { parseArgs } from 'node:util';

export type Command = 'extract' | 'export' | 'bundle' | 'import' | 'help';

export interface CliOptions {
  command: Command;
  // extractコマンド用
  companiesPath?: string;
  urlsPath?: string;
  outputPath?: string;
  parallel?: number;
  // export/bundleコマンド用
  format?: 'csv' | 'json';
  reviewPath?: string;
  final?: boolean;
  // 共通
  help: boolean;
}

const helpText = `
従業員数自動取得システム (OpenRouter専用)

使用方法:
  npm run start -- <command> [オプション]

コマンド:
  extract             従業員数を抽出（デフォルト）
  export              結果をエクスポート
  bundle              レビュー用バンドルを作成
  import              レビュー結果をインポート
  help                ヘルプを表示

=== extractコマンド ===
  npm run start -- extract [オプション]
  
  オプション:
    --companies <path>  企業リストCSVファイルのパス (デフォルト: data/companies.csv)
    --urls <path>       URLリストCSVファイルのパス (デフォルト: data/urls.csv)
    --output <path>     結果出力先のパス (デフォルト: output/results_[timestamp].csv)
    --parallel <num>    並列処理数 (デフォルト: 3)

=== exportコマンド ===
  npm run start -- export [オプション]
  
  オプション:
    --format <type>     出力形式: csv | json (デフォルト: csv)
    --output <path>     出力先パス (デフォルト: output/export.[csv|json])
    --final             レビュー済み最終結果を出力
    --review <path>     レビュー結果JSONのパス（--final時に使用）

  例:
    npm run start -- export --format csv
    npm run start -- export --format json --output output/review.json
    npm run start -- export --final --review output/review/review.json

=== bundleコマンド ===
  npm run start -- bundle [オプション]
  
  オプション:
    --output <path>     出力ディレクトリ (デフォルト: output/)
  
  例:
    npm run start -- bundle --output output/

=== importコマンド ===
  npm run start -- import --review <path>
  
  オプション:
    --review <path>     インポートするレビュー結果JSONのパス（必須）
  
  例:
    npm run start -- import --review output/review/review.json

必須環境変数:
  OPENROUTER_API_KEY  OpenRouterのAPIキー (https://openrouter.ai/keys)
`;

export function parseCliArgs(argv: string[] = process.argv.slice(2)): CliOptions {
  try {
    // コマンドを判定
    const firstArg = argv[0];
    const validCommands = ['extract', 'export', 'bundle', 'import', 'help'];
    const command: Command = validCommands.includes(firstArg) 
      ? firstArg as Command 
      : 'extract';
    
    // コマンドがある場合は引数から除外
    const argsForParsing = validCommands.includes(firstArg) 
      ? argv.slice(1) 
      : argv;
    
    // helpコマンドの場合
    if (command === 'help' || argsForParsing.includes('--help')) {
      console.log(helpText);
      process.exit(0);
    }
    
    const { values } = parseArgs({
      args: argsForParsing,
      options: {
        // extractコマンド用
        companies: { type: 'string' },
        urls: { type: 'string' },
        parallel: { type: 'string' },
        // export/bundle/import用
        format: { type: 'string' },
        review: { type: 'string' },
        final: { type: 'boolean', default: false },
        // 共通
        output: { type: 'string' },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: true,
    });
    
    // コマンドごとのデフォルト値設定
    let options: CliOptions = {
      command,
      help: false,
    };
    
    switch (command) {
      case 'extract':
        options = {
          ...options,
          companiesPath: values.companies as string || 'data/companies.csv',
          urlsPath: values.urls as string || 'data/urls.csv',
          outputPath: values.output as string,
          parallel: values.parallel ? parseInt(values.parallel as string, 10) : undefined,
        };
        break;
        
      case 'export':
        const format = (values.format as 'csv' | 'json') || 'csv';
        options = {
          ...options,
          format,
          outputPath: values.output as string || `output/export.${format}`,
          final: values.final as boolean,
          reviewPath: values.review as string,
        };
        break;
        
      case 'bundle':
        options = {
          ...options,
          outputPath: values.output as string || 'output/',
        };
        break;
        
      case 'import':
        if (!values.review) {
          console.error('エラー: importコマンドには --review オプションが必須です');
          console.log(helpText);
          process.exit(1);
        }
        options = {
          ...options,
          reviewPath: values.review as string,
        };
        break;
    }
    
    return options;
    
  } catch (error) {
    console.error('引数の解析に失敗しました:', error);
    console.log(helpText);
    process.exit(1);
  }
}

export function printUsage(): void {
  console.log(helpText);
}