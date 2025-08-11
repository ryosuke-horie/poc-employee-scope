'use client';

import { useEffect, useState } from 'react';
import { useReview } from '@/contexts/ReviewContext';
import CompanyList from '@/components/CompanyList';
import Filters from '@/components/Filters';
import Toolbar from '@/components/Toolbar';
import { CompanyWithReview } from '@/types/review';

export default function HomePage() {
  const { 
    reviewData, 
    loading, 
    error, 
    dispatch, 
    loadFromLocalStorage,
    saveToLocalStorage,
    getBestEvidence,
    hasUnsavedChanges
  } = useReview();
  
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithReview[]>([]);

  // 初回ロード時の処理
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', loading: true });
      
      // まずlocalStorageから読み込みを試みる
      const hasLocalData = loadFromLocalStorage();
      
      if (!hasLocalData) {
        // localStorageにデータがない場合、review.jsonから読み込む
        try {
          const response = await fetch('/review.json');
          if (!response.ok) {
            throw new Error(`Failed to load review.json: ${response.status}`);
          }
          
          const data = await response.json();
          dispatch({ type: 'SET_DATA', payload: data });
        } catch (err) {
          console.error('Error loading review data:', err);
          dispatch({ 
            type: 'SET_ERROR', 
            error: err instanceof Error ? err.message : 'Failed to load review data' 
          });
        }
      }
      
      dispatch({ type: 'SET_LOADING', loading: false });
    };
    
    loadData();
  }, []);

  // reviewDataが変更されたら企業リストを更新
  useEffect(() => {
    if (reviewData) {
      const companiesWithReview = reviewData.companies.map(company => {
        const evidences = reviewData.evidence.filter(e => e.company_id === company.id);
        const reviewState = reviewData.review_state.find(r => r.company_id === company.id);
        const bestEvidence = getBestEvidence(company.id);
        
        return {
          ...company,
          evidences,
          reviewState,
          bestEvidence,
        };
      });
      
      setFilteredCompanies(companiesWithReview);
    }
  }, [reviewData, getBestEvidence]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-2">データを読み込み中...</div>
          <div className="text-sm text-gray-500">しばらくお待ちください</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">データがありません</div>
          <p className="text-sm text-gray-500 mb-4">
            public/review.json ファイルが存在することを確認してください
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  const completedCount = reviewData.review_state.filter(r => r.decision !== 'unknown').length;
  const totalCount = reviewData.companies.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                従業員数レビューシステム
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                生成日時: {new Date(reviewData.generated_at).toLocaleString('ja-JP')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                進捗: {completedCount} / {totalCount} 企業
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <Toolbar
        onSave={saveToLocalStorage}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Filters
              companies={filteredCompanies}
              onFilter={setFilteredCompanies}
              reviewData={reviewData}
            />
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b">
                <h2 className="text-lg font-semibold">
                  企業一覧 ({filteredCompanies.length}件)
                </h2>
              </div>
              <CompanyList companies={filteredCompanies} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}