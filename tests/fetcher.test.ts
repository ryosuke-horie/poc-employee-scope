import { describe, it, expect, afterAll } from 'vitest';
import { fetcher, extractTextFromUrl } from '../src/fetcher.js';

describe('Fetcher', () => {
  afterAll(async () => {
    await fetcher.close();
  });
  
  it.skip('ページを取得できる（ネットワーク依存のためスキップ）', async () => {
    const result = await fetcher.fetchPage('https://example.com');
    
    expect(result.success).toBe(true);
    expect(result.text).toContain('Example Domain');
    expect(result.title).toContain('Example');
    expect(result.html).toContain('<html');
  }, 30000);
  
  // ネットワークテストは環境依存のためスキップ
  it.skip('存在しないページでエラーを返す', async () => {
    const result = await fetcher.fetchPage('https://example.com/404-not-found-page');
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 30000);
  
  it.skip('テキストを抽出できる', async () => {
    const text = await extractTextFromUrl('https://example.com');
    
    expect(text).toContain('Example Domain');
    expect(text).toContain('This domain is for use in illustrative examples');
  }, 30000);
});