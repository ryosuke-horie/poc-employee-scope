'use client';

import { useState, useEffect } from 'react';
import { CompanyWithReview, ReviewBundle } from '@/types/review';

interface FiltersProps {
  companies: CompanyWithReview[];
  onFilter: (filtered: CompanyWithReview[]) => void;
  reviewData: ReviewBundle;
}

export default function Filters({ companies, onFilter, reviewData }: FiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string[]>([]);
  
  // フィルタが変更されたら自動的に適用
  useEffect(() => {
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

    let filtered = [...allCompanies];
    
    // 検索フィルタ
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 判定フィルタ
    if (decisionFilter.length > 0) {
      filtered = filtered.filter(company => {
        const decision = company.reviewState?.decision || 'unset';
        return decisionFilter.includes(decision);
      });
    }
    
    onFilter(filtered);
  }, [searchTerm, decisionFilter, reviewData, onFilter]);

  const toggleDecisionFilter = (decision: string) => {
    setDecisionFilter(prev =>
      prev.includes(decision)
        ? prev.filter(d => d !== decision)
        : [...prev, decision]
    );
  };

  const decisionCounts = {
    ok: reviewData.companies.filter(c => 
      reviewData.review_state.find(r => r.company_id === c.id)?.decision === 'ok'
    ).length,
    ng: reviewData.companies.filter(c => 
      reviewData.review_state.find(r => r.company_id === c.id)?.decision === 'ng'
    ).length,
    unknown: reviewData.companies.filter(c => 
      reviewData.review_state.find(r => r.company_id === c.id)?.decision === 'unknown'
    ).length,
    unset: reviewData.companies.filter(c => 
      !reviewData.review_state.find(r => r.company_id === c.id)?.decision
    ).length,
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">フィルタ</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          企業名検索
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="企業名を入力..."
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          判定状態
        </label>
        <div className="space-y-2">
          {[
            { value: 'ok', label: 'OK', color: 'text-green-600' },
            { value: 'ng', label: 'NG', color: 'text-red-600' },
            { value: 'unknown', label: '不明', color: 'text-gray-600' },
            { value: 'unset', label: '未判定', color: 'text-yellow-600' },
          ].map(option => (
            <label
              key={option.value}
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={decisionFilter.includes(option.value)}
                  onChange={() => toggleDecisionFilter(option.value)}
                  className="mr-2"
                />
                <span className={option.color}>{option.label}</span>
              </div>
              <span className="text-sm text-gray-500">
                ({decisionCounts[option.value as keyof typeof decisionCounts]}件)
              </span>
            </label>
          ))}
        </div>
      </div>

      {(searchTerm || decisionFilter.length > 0) && (
        <div className="pt-4 border-t">
          <button
            onClick={() => {
              setSearchTerm('');
              setDecisionFilter([]);
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            フィルタをクリア
          </button>
        </div>
      )}

      <div className="pt-4 border-t text-xs text-gray-500">
        <p>全企業数: {reviewData.companies.length}</p>
        <p>表示中: {companies.length}件</p>
      </div>
    </div>
  );
}