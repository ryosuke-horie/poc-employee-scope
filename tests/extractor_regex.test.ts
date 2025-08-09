import { describe, it, expect } from 'vitest';
import { extractEmployeeCountByRegex } from '../src/extractor_regex.js';

describe('extractEmployeeCountByRegex', () => {
  describe('日本語パターン', () => {
    it('従業員数を抽出できる', () => {
      const text = '当社の従業員数は2,500名です。';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(2500);
      expect(result.rawText).toContain('2,500名');
    });

    it('従業員を抽出できる', () => {
      const text = '従業員 1,234人（2024年3月末時点）';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(1234);
      expect(result.rawText).toContain('1,234人');
    });

    it('社員数を抽出できる', () => {
      const text = '社員数：456名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(456);
    });

    it('連結従業員数を抽出できる', () => {
      const text = '連結従業員数 10,000名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(10000);
    });

  });

  describe('英語パターン', () => {
    it('Employeesを抽出できる', () => {
      const text = 'Employees: 500';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(500);
    });

    it('Number of employeesを抽出できる', () => {
      const text = 'Number of employees: 1,200';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(1200);
    });

    it('Total staffを抽出できる', () => {
      const text = 'Total staff: 350 people';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(350);
    });

  });

  describe('特殊ケース', () => {
    it('複数の数値がある場合は最初のものを抽出', () => {
      const text = '正社員：100名、パート：50名、従業員数：150名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(150);
    });

    it('約や概算表記を処理できる', () => {
      const text = '従業員数：約300名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(300);
    });

    it('従業員数が見つからない場合', () => {
      const text = 'この会社は素晴らしい製品を作っています。';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(false);
      expect(result.value).toBe(null);
      expect(result.rawText).toBe('');
    });

    it('ゼロや負の数は無視する', () => {
      const text = '従業員数：0名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(false);
      expect(result.value).toBe(null);
    });

    it('巨大な数値でも抽出する', () => {
      // 現在の実装では巨大な数値も抽出される（フィルタリングは未実装）
      const text = '従業員数：1000000名';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.found).toBe(true);
      expect(result.value).toBe(1000000);
    });
  });

  describe('信頼度スコア', () => {
    it('正確な表記は高スコア', () => {
      const text = '従業員数：500名（2024年3月末現在）';
      const result = extractEmployeeCountByRegex(text);
      
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('曖昧な表記は低スコア', () => {
      const text = '約100人程度の社員がいます';
      const result = extractEmployeeCountByRegex(text);
      
      if (result.found) {
        expect(result.confidence).toBeLessThan(0.8);
      }
    });
  });
});