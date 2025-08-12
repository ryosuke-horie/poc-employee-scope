'use client';

import { CompanyWithReview } from '@/types/review';
import Link from 'next/link';
// import { useReview } from '@/contexts/ReviewContext';
// import { hasCompanyDiff } from '@/lib/diff';
// import DiffIndicator from './DiffIndicator';

interface CompanyListProps {
  companies: CompanyWithReview[];
}

export default function CompanyList({ companies }: CompanyListProps) {
  // const { diffMode, diff } = useReview();
  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-300';
      case 'ng': return 'bg-red-100 text-red-800 border-red-300';
      case 'unknown': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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

  if (companies.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        表示する企業がありません
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {companies.map(company => {
        // const companyDiff = diff?.companies.find(c => c.company_id === company.id);
        // const hasDiff = diffMode && diff && hasCompanyDiff(company.id, diff);
        
        return (
          <Link
            key={company.id}
            href={`/company/${company.id}`}
            className="block hover:bg-gray-50 transition-colors"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {company.name}
                    </h3>
                    {/* {diffMode && companyDiff && companyDiff.type !== 'unchanged' && (
                      <DiffIndicator type={companyDiff.type} />
                    )} */}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDecisionColor(company.reviewState?.decision)}`}>
                      {getDecisionLabel(company.reviewState?.decision)}
                    </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>証跡: {company.evidences.length}件</span>
                  {company.bestEvidence && (
                    <>
                      <span>•</span>
                      <span>
                        代表値: {company.bestEvidence.value !== null 
                          ? `${company.bestEvidence.value.toLocaleString()}人` 
                          : '—'}
                      </span>
                      {company.bestEvidence.score !== null && (
                        <>
                          <span>•</span>
                          <span>信頼度: {(company.bestEvidence.score * 100).toFixed(0)}%</span>
                        </>
                      )}
                    </>
                  )}
                </div>

                {company.reviewState?.override_value !== null && company.reviewState?.override_value !== undefined && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    <span className="font-medium">上書き値:</span>
                    <span>{company.reviewState.override_value.toLocaleString()}人</span>
                  </div>
                )}

                {company.reviewState?.note && (
                  <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                    📝 {company.reviewState.note}
                  </p>
                )}

                {company.reviewState?.decided_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    最終更新: {new Date(company.reviewState.decided_at).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
          </Link>
        );
      })}
    </div>
  );
}