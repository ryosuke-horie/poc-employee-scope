'use client';

import { useState } from 'react';
import { CompanyWithReview, ReviewBundle } from '@/types/review';

interface FiltersProps {
  companies: CompanyWithReview[];
  onFilter: (filtered: CompanyWithReview[]) => void;
  reviewData: ReviewBundle;
}

export default function Filters({ companies, onFilter, reviewData }: FiltersProps) {
  const [decisionFilter, setDecisionFilter] = useState<string[]>(['ok', 'ng', 'unknown', 'none']);
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(1);

  const applyFilters = () => {
    const allCompanies = reviewData.companies.map(company => {
      const evidences = reviewData.evidence.filter(e => e.company_id === company.id);
      const reviewState = reviewData.review_state.find(r => r.company_id === company.id);
      const bestEvidence = evidences
        .filter(e => e.value !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      return {
        ...company,
        evidences,
        reviewState,
        bestEvidence,
      };
    });

    const filtered = allCompanies.filter(company => {
      // Decision filter
      const decision = company.reviewState?.decision || 'none';
      if (!decisionFilter.includes(decision === 'none' ? 'none' : decision)) {
        return false;
      }

      // Score filter
      if (company.bestEvidence) {
        const score = company.bestEvidence.score || 0;
        if (score < scoreMin || score > scoreMax) {
          return false;
        }
      }

      return true;
    });

    onFilter(filtered);
  };

  const toggleDecision = (decision: string) => {
    setDecisionFilter(prev => {
      if (prev.includes(decision)) {
        return prev.filter(d => d !== decision);
      } else {
        return [...prev, decision];
      }
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">フィルタ</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            判定状態
          </label>
          <div className="space-y-2">
            {[
              { value: 'ok', label: 'OK' },
              { value: 'ng', label: 'NG' },
              { value: 'unknown', label: '不明' },
              { value: 'none', label: '未判定' },
            ].map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={decisionFilter.includes(option.value)}
                  onChange={() => toggleDecision(option.value)}
                  className="mr-2"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            信頼度スコア
          </label>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-600">最小: {(scoreMin * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreMin * 100}
                onChange={(e) => setScoreMin(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">最大: {(scoreMax * 100).toFixed(0)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={scoreMax * 100}
                onChange={(e) => setScoreMax(parseInt(e.target.value) / 100)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <button
          onClick={applyFilters}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          フィルタを適用
        </button>
      </div>
    </div>
  );
}