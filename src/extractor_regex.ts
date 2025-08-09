import { logger } from './logger.js';

export interface RegexExtractionResult {
  found: boolean;
  value: number | null;
  rawText: string;
  confidence: number;
}

// 従業員数を表す正規表現パターン
const EMPLOYEE_PATTERNS = [
  // 日本語パターン
  {
    pattern: /従業員数[\s:：]*([0-9０-９,，]+)[\s]*(?:名|人)/gi,
    confidence: 0.95,
    name: '従業員数_名/人',
  },
  {
    pattern: /従業員[\s:：]*([0-9０-９,，]+)[\s]*(?:名|人)/gi,
    confidence: 0.9,
    name: '従業員_名/人',
  },
  {
    pattern: /社員数[\s:：]*([0-9０-９,，]+)[\s]*(?:名|人)/gi,
    confidence: 0.9,
    name: '社員数_名/人',
  },
  {
    pattern: /従業員[\s]*(?:（単体）|（連結）)?[\s:：]*([0-9０-９,，]+)/gi,
    confidence: 0.85,
    name: '従業員_単体/連結',
  },
  {
    pattern: /スタッフ数[\s:：]*([0-9０-９,，]+)[\s]*(?:名|人)/gi,
    confidence: 0.8,
    name: 'スタッフ数',
  },
  {
    pattern: /人員[\s:：]*([0-9０-９,，]+)[\s]*(?:名|人)/gi,
    confidence: 0.75,
    name: '人員',
  },
  
  // 英語パターン
  {
    pattern: /Employees?[\s:：]*([0-9,]+)/gi,
    confidence: 0.9,
    name: 'Employees',
  },
  {
    pattern: /Number\s+of\s+Employees?[\s:：]*([0-9,]+)/gi,
    confidence: 0.95,
    name: 'Number of Employees',
  },
  {
    pattern: /Staff[\s:：]*([0-9,]+)/gi,
    confidence: 0.8,
    name: 'Staff',
  },
  {
    pattern: /Workforce[\s:：]*([0-9,]+)/gi,
    confidence: 0.8,
    name: 'Workforce',
  },
  {
    pattern: /Team\s+(?:Size|Members?)[\s:：]*([0-9,]+)/gi,
    confidence: 0.7,
    name: 'Team Size',
  },
  
  // 表形式・リスト形式
  {
    pattern: /(?:従業員|社員|Employees?)[^0-9０-９]*([0-9０-９,，]+)\s*(?:名|人)?[^0-9０-９]/gi,
    confidence: 0.7,
    name: '表形式',
  },
];

/**
 * 全角数字を半角に変換
 */
function normalizeNumber(text: string): string {
  return text
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/[，]/g, ',')
    .replace(/,/g, '');
}

/**
 * 数値文字列をパースして数値に変換
 */
function parseEmployeeCount(text: string): number | null {
  const normalized = normalizeNumber(text);
  const num = parseInt(normalized, 10);
  
  if (isNaN(num)) {
    return null;
  }
  
  // 妥当性チェック（1人以上、1000万人以下）
  if (num < 1 || num > 10000000) {
    logger.debug(`従業員数が範囲外: ${num}`);
    return null;
  }
  
  return num;
}

/**
 * テキストから従業員数を正規表現で抽出
 */
export function extractEmployeeCountByRegex(text: string): RegexExtractionResult {
  if (!text || text.trim() === '') {
    return {
      found: false,
      value: null,
      rawText: '',
      confidence: 0,
    };
  }
  
  const results: Array<{
    value: number;
    rawText: string;
    confidence: number;
    patternName: string;
  }> = [];
  
  // 各パターンでマッチを試行
  for (const { pattern, confidence, name } of EMPLOYEE_PATTERNS) {
    const matches = [...text.matchAll(pattern)];
    
    for (const match of matches) {
      if (match[1]) {
        const value = parseEmployeeCount(match[1]);
        if (value !== null) {
          // マッチした前後のコンテキストを取得
          const startIndex = Math.max(0, match.index! - 50);
          const endIndex = Math.min(text.length, match.index! + match[0].length + 50);
          const context = text.substring(startIndex, endIndex).trim();
          
          results.push({
            value,
            rawText: context,
            confidence,
            patternName: name,
          });
          
          logger.debug(`正規表現マッチ: ${name}`, {
            value,
            pattern: name,
            context: context.substring(0, 100),
          });
        }
      }
    }
  }
  
  if (results.length === 0) {
    logger.debug('正規表現で従業員数が見つかりませんでした');
    return {
      found: false,
      value: null,
      rawText: '',
      confidence: 0,
    };
  }
  
  // 信頼度が最も高い結果を選択
  results.sort((a, b) => {
    // 信頼度で降順ソート
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    // 同じ信頼度の場合は、より具体的な数値を優先
    return b.value - a.value;
  });
  
  const best = results[0];
  
  // 複数の異なる値が見つかった場合は信頼度を下げる
  const uniqueValues = new Set(results.map(r => r.value));
  const adjustedConfidence = uniqueValues.size > 1 
    ? best.confidence * 0.8 
    : best.confidence;
  
  logger.info(`正規表現で従業員数を抽出: ${best.value}人`, {
    pattern: best.patternName,
    confidence: adjustedConfidence,
    candidateCount: results.length,
  });
  
  return {
    found: true,
    value: best.value,
    rawText: best.rawText,
    confidence: adjustedConfidence,
  };
}

/**
 * 複数のテキストから従業員数を抽出（フォールバック付き）
 */
export function extractEmployeeCountFromMultipleSources(
  texts: string[]
): RegexExtractionResult {
  const allResults: RegexExtractionResult[] = [];
  
  for (const text of texts) {
    const result = extractEmployeeCountByRegex(text);
    if (result.found) {
      allResults.push(result);
    }
  }
  
  if (allResults.length === 0) {
    return {
      found: false,
      value: null,
      rawText: '',
      confidence: 0,
    };
  }
  
  // 最も信頼度の高い結果を返す
  allResults.sort((a, b) => b.confidence - a.confidence);
  return allResults[0];
}