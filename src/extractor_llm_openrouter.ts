import OpenAI from 'openai';
import { config } from './config.js';
import { logger } from './logger.js';
import { withRetry } from './utils.js';

export interface LLMExtractionResult {
  found: boolean;
  value: number | null;
  rawText: string;
  confidence: number;
  model: string;
}

// OpenRouter APIクライアント
let openRouterClient: OpenAI | null = null;

/**
 * OpenRouterクライアントの初期化
 */
function getOpenRouterClient(): OpenAI {
  if (!openRouterClient) {
    if (!config.openRouterApiKey) {
      throw new Error('OpenRouter APIキーが設定されていません');
    }
    
    openRouterClient = new OpenAI({
      apiKey: config.openRouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/poc-employee-scope',
        'X-Title': 'Employee Count Extractor',
      },
    });
  }
  
  return openRouterClient;
}

/**
 * プロンプトテンプレート
 */
const EXTRACTION_PROMPT = `あなたは企業情報から従業員数を抽出する専門家です。
以下のテキストから、その企業の従業員数を抽出してください。

重要な注意事項：
- 最新の従業員数を優先してください
- 連結従業員数がある場合は連結を優先
- グループ全体の人数がある場合はそれを優先
- 「約」「およそ」などの概数も正確に抽出
- パートタイマーを含む場合と含まない場合があるので注意

テキスト：
"""
{text}
"""

以下のJSON形式で厳密に回答してください：
{
  "employee_count": 従業員数（数値のみ、見つからない場合はnull）,
  "raw_text": 抽出元のテキスト部分（50文字以内）,
  "confidence": 信頼度（0.0〜1.0）,
  "notes": 補足情報（連結/単体、時点など）
}`;

/**
 * テキストを切り詰める（トークン数削減）
 */
function truncateText(text: string, maxLength: number = 3000): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // 従業員数に関連しそうな部分を優先的に残す
  const keywords = ['従業員', '社員', '人員', 'employee', 'staff', '人数', '名', '人'];
  const lines = text.split('\n');
  const relevantLines: string[] = [];
  const otherLines: string[] = [];
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(keyword => lowerLine.includes(keyword))) {
      relevantLines.push(line);
    } else {
      otherLines.push(line);
    }
  }
  
  // 関連行を優先して結合
  let result = relevantLines.join('\n');
  
  // 残りスペースに他の行を追加
  for (const line of otherLines) {
    if (result.length + line.length + 1 > maxLength) {
      break;
    }
    result += '\n' + line;
  }
  
  return result.substring(0, maxLength);
}

/**
 * LLMレスポンスのパース
 */
function parseJSONResponse(content: string): any {
  try {
    // JSONブロックを抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    logger.error('JSON パースエラー', { content, error });
    return null;
  }
}

/**
 * OpenRouterを使って従業員数を抽出
 */
export async function extractEmployeeCountByOpenRouter(
  text: string
): Promise<LLMExtractionResult> {
  if (!text || text.trim() === '') {
    return {
      found: false,
      value: null,
      rawText: '',
      confidence: 0,
      model: config.openRouterModelId,
    };
  }
  
  try {
    const client = getOpenRouterClient();
    const truncatedText = truncateText(text);
    const prompt = EXTRACTION_PROMPT.replace('{text}', truncatedText);
    
    logger.debug('OpenRouter APIを呼び出し中', {
      model: config.openRouterModelId,
      textLength: truncatedText.length,
    });
    
    const response = await withRetry(
      async () => {
        return await client.chat.completions.create({
          model: config.openRouterModelId,
          messages: [
            {
              role: 'system',
              content: 'あなたは正確にJSONフォーマットで回答する専門家です。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        });
      },
      2,
      3000,
      2
    );
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('LLMレスポンスが空です');
    }
    
    const parsed = parseJSONResponse(content);
    if (!parsed) {
      throw new Error('LLMレスポンスのパースに失敗');
    }
    
    const employeeCount = parsed.employee_count;
    
    if (employeeCount === null || employeeCount === undefined) {
      logger.info('LLMで従業員数が見つかりませんでした');
      return {
        found: false,
        value: null,
        rawText: '',
        confidence: 0,
        model: config.openRouterModelId,
      };
    }
    
    // 数値の妥当性チェック
    const count = typeof employeeCount === 'string' 
      ? parseInt(employeeCount.replace(/[,，]/g, ''), 10)
      : employeeCount;
    
    if (isNaN(count) || count < 1 || count > 10000000) {
      logger.warn(`LLM抽出値が範囲外: ${count}`);
      return {
        found: false,
        value: null,
        rawText: '',
        confidence: 0,
        model: config.openRouterModelId,
      };
    }
    
    logger.info(`LLMで従業員数を抽出: ${count}人`, {
      model: config.openRouterModelId,
      confidence: parsed.confidence || 0.7,
      notes: parsed.notes,
    });
    
    return {
      found: true,
      value: count,
      rawText: parsed.raw_text || '',
      confidence: parsed.confidence || 0.7,
      model: config.openRouterModelId,
    };
    
  } catch (error) {
    logger.error('OpenRouter API エラー', error);
    return {
      found: false,
      value: null,
      rawText: '',
      confidence: 0,
      model: config.openRouterModelId,
    };
  }
}