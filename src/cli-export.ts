#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { exportReviewJson, exportCsv } from './export.js';
import { db } from './db.js';
import { logger } from './logger.js';

interface ExportOptions {
  format: 'json' | 'csv';
  output?: string;
  help: boolean;
}

const helpText = `
poc export - データをエクスポート

使用方法:
  npm run export -- [オプション]
  npx poc export [オプション]

オプション:
  --format <format>  出力形式 (json|csv) (デフォルト: json)
  --output <path>    出力先ファイルパス
  --help             ヘルプを表示

例:
  npm run export                          # review.jsonを出力
  npm run export -- --format csv          # CSVを出力
  npm run export -- --output custom.json  # カスタムパスに出力

出力先:
  JSON: output/review/review.json (frontend/public/review.jsonにもコピー)
  CSV:  output/export_[timestamp].csv
`;

function parseExportArgs(): ExportOptions {
  try {
    const { values } = parseArgs({
      options: {
        format: {
          type: 'string',
          default: 'json',
        },
        output: {
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
    
    const format = values.format as string;
    if (!['json', 'csv'].includes(format)) {
      throw new Error(`無効な形式: ${format} (json または csv を指定してください)`);
    }
    
    return {
      format: format as 'json' | 'csv',
      output: values.output as string | undefined,
      help: false,
    };
    
  } catch (error) {
    console.error('引数の解析に失敗しました:', error);
    console.log(helpText);
    process.exit(1);
  }
}

async function main() {
  try {
    const options = parseExportArgs();
    
    // データベースの初期化
    await db.initialize();
    
    // 企業数と証跡数を確認
    const companies = db.getAllCompanies();
    const evidence = db.getAllEvidence();
    
    if (companies.length === 0) {
      logger.warn('エクスポートする企業データがありません');
      logger.info('先に「npm run start」でデータを収集してください');
      process.exit(1);
    }
    
    logger.info(`エクスポート開始: ${companies.length}社、${evidence.length}件の証跡`);
    
    // 形式に応じてエクスポート
    if (options.format === 'json') {
      await exportReviewJson(options.output);
    } else {
      await exportCsv(options.output);
    }
    
    logger.info('エクスポートが完了しました');
    
  } catch (error) {
    logger.error('エクスポート中にエラーが発生しました', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// スクリプトとして直接実行された場合のみmain()を実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}