'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReviewBundle, CompanyWithReview, ReviewState } from '@/types/review';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);
  
  const [reviewData, setReviewData] = useState<ReviewBundle | null>(null);
  const [company, setCompany] = useState<CompanyWithReview | null>(null);
  const [reviewState, setReviewState] = useState<ReviewState>({
    company_id: companyId,
    decision: 'unknown',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      const response = await fetch('/review.json');
      const data: ReviewBundle = await response.json();
      setReviewData(data);
      
      const companyData = data.companies.find(c => c.id === companyId);
      if (!companyData) {
        router.push('/');
        return;
      }
      
      const evidences = data.evidence.filter(e => e.company_id === companyId);
      const existingReviewState = data.review_state.find(r => r.company_id === companyId);
      const bestEvidence = evidences
        .filter(e => e.value !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      setCompany({
        ...companyData,
        evidences,
        reviewState: existingReviewState,
        bestEvidence,
      });
      
      if (existingReviewState) {
        setReviewState(existingReviewState);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!reviewData || !company) return;
    
    const updatedReviewState = {
      ...reviewState,
      decided_at: new Date().toISOString(),
    };
    
    const updatedReviewStates = reviewData.review_state.filter(r => r.company_id !== companyId);
    updatedReviewStates.push(updatedReviewState);
    
    const updatedData = {
      ...reviewData,
      review_state: updatedReviewStates,
    };
    
    // JSONをダウンロード
    const blob = new Blob([JSON.stringify(updatedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center">企業が見つかりません</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-blue-500 hover:text-blue-600">
              ← 一覧に戻る
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              {company.name}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">証跡一覧 ({company.evidences.length}件)</h2>
            
            {company.evidences.map((evidence, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    {evidence.value ? (
                      <p className="text-2xl font-bold text-gray-900">{evidence.value}人</p>
                    ) : (
                      <p className="text-lg text-gray-500">抽出失敗</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      信頼度: {((evidence.score || 0) * 100).toFixed(0)}% / 
                      方法: {evidence.model || 'none'}
                    </p>
                  </div>
                  {evidence.status_code && (
                    <span className={`px-2 py-1 text-xs rounded ${
                      evidence.status_code === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      HTTP {evidence.status_code}
                    </span>
                  )}
                </div>
                
                {evidence.raw_text && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {evidence.raw_text}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p>URL: <a href={evidence.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {evidence.source_url}
                  </a></p>
                  {evidence.page_title && <p>タイトル: {evidence.page_title}</p>}
                  <p>取得日時: {new Date(evidence.extracted_at).toLocaleString('ja-JP')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">レビュー判定</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    判定
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'ok', label: 'OK', color: 'green' },
                      { value: 'ng', label: 'NG', color: 'red' },
                      { value: 'unknown', label: '不明', color: 'gray' },
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          value={option.value}
                          checked={reviewState.decision === option.value}
                          onChange={(e) => setReviewState({
                            ...reviewState,
                            decision: e.target.value as 'ok' | 'ng' | 'unknown',
                          })}
                          className="mr-2"
                        />
                        <span className={`text-${option.color}-600`}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上書き値（任意）
                  </label>
                  <input
                    type="number"
                    value={reviewState.override_value || ''}
                    onChange={(e) => setReviewState({
                      ...reviewState,
                      override_value: e.target.value ? parseInt(e.target.value) : null,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メモ（任意）
                  </label>
                  <textarea
                    value={reviewState.note || ''}
                    onChange={(e) => setReviewState({
                      ...reviewState,
                      note: e.target.value || null,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="メモを入力..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}