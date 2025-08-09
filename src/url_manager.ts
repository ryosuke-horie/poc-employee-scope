import { logger } from './logger.js';
import { type UrlData } from './csv_loader.js';

/**
 * URLの優先度に基づいてソースタイプを分類
 */
export function categorizeByPriority(urls: UrlData[]): {
  high: UrlData[];
  medium: UrlData[];
  low: UrlData[];
} {
  const high = urls.filter(u => u.priority <= 3);
  const medium = urls.filter(u => u.priority > 3 && u.priority <= 7);
  const low = urls.filter(u => u.priority > 7);
  
  return { high, medium, low };
}

/**
 * URL処理戦略の決定
 */
export function determineStrategy(urls: UrlData[]): string {
  const categories = categorizeByPriority(urls);
  
  if (categories.high.length > 0) {
    return 'high-priority-first';
  } else if (categories.medium.length > 0) {
    return 'medium-priority-fallback';
  } else {
    return 'low-priority-scan';
  }
}

/**
 * URL情報のサマリーを表示
 */
export function printUrlSummary(companyName: string, urls: UrlData[]): void {
  const categories = categorizeByPriority(urls);
  const sourceTypes = new Set(urls.map(u => u.source_type));
  
  logger.info(`${companyName} のURL構成:`, {
    total: urls.length,
    highPriority: categories.high.length,
    mediumPriority: categories.medium.length,
    lowPriority: categories.low.length,
    sourceTypes: Array.from(sourceTypes),
    strategy: determineStrategy(urls),
  });
}

/**
 * 優先度に基づくフォールバック戦略の説明
 */
export function explainFallbackStrategy(): string {
  return `
フォールバック戦略:
1. 優先度1-3（高）: 公式サイト、IR情報など最も信頼できるソース
2. 優先度4-7（中）: Wikipedia、ニュース記事など二次情報源
3. 優先度8-10（低）: その他の参考情報源

処理順序:
- 優先度の低い順（1→2→3...）に処理
- 各URLで従業員数が見つかれば即座に終了
- 見つからない場合は次の優先度のURLへフォールバック
- すべてのURLで見つからない場合は抽出失敗として記録
`;
}