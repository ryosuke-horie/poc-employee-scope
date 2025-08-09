'use client';

import { CompanyWithReview, ReviewBundle, ReviewState } from '@/types/review';
import Link from 'next/link';

interface CompanyListProps {
  companies: CompanyWithReview[];
  reviewData: ReviewBundle;
  onUpdateReview: (companyId: number, reviewState: ReviewState) => void;
}

export default function CompanyList({ companies, reviewData, onUpdateReview }: CompanyListProps) {
  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'ng': return 'bg-red-100 text-red-800';
      case 'unknown': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDecisionLabel = (decision?: string) => {
    switch (decision) {
      case 'ok': return 'OK';
      case 'ng': return 'NG';
      case 'unknown': return '不明';
      default: return '未判定';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">
          企業一覧 ({companies.length}社)
        </h2>
        <p className="text-sm text-gray-600">
          判定済み: {companies.filter(c => c.reviewState?.decision).length}社 / 
          未判定: {companies.filter(c => !c.reviewState?.decision).length}社
        </p>
      </div>

      {companies.map(company => (
        <div key={company.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {company.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  証跡: {company.evidences.length}件
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDecisionColor(company.reviewState?.decision)}`}>
                  {getDecisionLabel(company.reviewState?.decision)}
                </span>
              </div>
            </div>

            {company.bestEvidence && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">抽出値:</span> {company.bestEvidence.value}人
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">信頼度:</span> {((company.bestEvidence.score || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">抽出方法:</span> {company.bestEvidence.model}
                </p>
              </div>
            )}

            {company.reviewState?.override_value && (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">上書き値:</span> {company.reviewState.override_value}人
                </p>
              </div>
            )}

            {company.reviewState?.note && (
              <div className="mb-4 p-3 bg-yellow-50 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">メモ:</span> {company.reviewState.note}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/company/${company.id}`}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                詳細を見る
              </Link>
              
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={() => onUpdateReview(company.id, {
                    company_id: company.id,
                    decision: 'ok',
                    decided_at: new Date().toISOString(),
                  })}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={() => onUpdateReview(company.id, {
                    company_id: company.id,
                    decision: 'ng',
                    decided_at: new Date().toISOString(),
                  })}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  NG
                </button>
                <button
                  onClick={() => onUpdateReview(company.id, {
                    company_id: company.id,
                    decision: 'unknown',
                    decided_at: new Date().toISOString(),
                  })}
                  className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  不明
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}