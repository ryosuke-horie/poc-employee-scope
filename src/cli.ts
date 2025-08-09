import { parseArgs } from 'node:util';

export interface CliOptions {
  companiesPath: string;
  urlsPath: string;
  outputPath?: string;
  parallel?: number;
  help: boolean;
}

const helpText = `
従業員数自動取得システム (OpenRouter専用)

使用方法:
  npm run start -- [オプション]

必須環境変数:
  OPENROUTER_API_KEY  OpenRouterのAPIキー (https://openrouter.ai/keys)

オプション:
  --companies <path>  企業リストCSVファイルのパス (デフォルト: data/companies.csv)
  --urls <path>       URLリストCSVファイルのパス (デフォルト: data/urls.csv)
  --output <path>     結果出力先のパス (デフォルト: output/results_[timestamp].csv)
  --parallel <num>    並列処理数 (デフォルト: 3)
  --help              ヘルプを表示

例:
  npm run start
  npm run start -- --companies data/companies.csv --urls data/urls.csv
  npm run start -- --output output/results.csv --parallel 5

CSVファイル形式:
  companies.csv: id,name
  urls.csv: company_id,url,source_type,priority
`;

export function parseCliArgs(): CliOptions {
  try {
    const { values } = parseArgs({
      options: {
        companies: {
          type: 'string',
          default: 'data/companies.csv',
        },
        urls: {
          type: 'string', 
          default: 'data/urls.csv',
        },
        output: {
          type: 'string',
        },
        parallel: {
          type: 'string',
        },
        help: {
          type: 'boolean',
          default: false,
        },
      },
      allowPositionals: true,
    });
    
    if (values.help) {
      console.log(helpText);
      process.exit(0);
    }
    
    return {
      companiesPath: values.companies as string,
      urlsPath: values.urls as string,
      outputPath: values.output as string | undefined,
      parallel: values.parallel ? parseInt(values.parallel as string, 10) : undefined,
      help: false,
    };
    
  } catch (error) {
    console.error('引数の解析に失敗しました:', error);
    console.log(helpText);
    process.exit(1);
  }
}

export function printUsage(): void {
  console.log(helpText);
}