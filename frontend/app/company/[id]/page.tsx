'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReview } from '@/contexts/ReviewContext';
import EvidenceCard from '@/components/EvidenceCard';
import DecisionControls from '@/components/DecisionControls';
import { ReviewState } from '@/types/review';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = parseInt(params.id as string);
  
  const { 
    reviewData,
    getCompanyWithReview, 
    updateReviewState, 
    saveToLocalStorage,
    dispatch,
    loadFromLocalStorage 
  } = useReview();
  
  const [localReviewState, setLocalReviewState] = useState<ReviewState>({
    company_id: companyId,
    decision: 'unknown',
    override_value: null,
    note: null,
  });
  
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  
  const { company, evidences, reviewState, bestEvidence } = getCompanyWithReview(companyId);

  // 初回ロード
  useEffect(() => {
    const loadData = async () => {
      if (!reviewData) {
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
      }
    };
    
    loadData();
  }, [reviewData, dispatch, loadFromLocalStorage]);

  // レビュー状態の初期化
  useEffect(() => {
    if (reviewState) {
      setLocalReviewState(reviewState);
      setHasLocalChanges(false);
    } else {
      setLocalReviewState({
        company_id: companyId,
        decision: 'unknown',
        override_value: null,
        note: null,
      });
    }
  }, [reviewState, companyId]);

  // 企業が見つからない場合は一覧に戻る
  useEffect(() => {
    if (reviewData && !company) {
      router.push('/');
    }
  }, [reviewData, company, router]);

  const handleReviewStateChange = (partialState: Partial<ReviewState>) => {
    setLocalReviewState(prev => ({
      ...prev,
      ...partialState,
    }));
    setHasLocalChanges(true);
  };

  const handleSave = () => {
    updateReviewState(companyId, localReviewState);
    saveToLocalStorage();
    setHasLocalChanges(false);
  };

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">データを読み込み中...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">企業が見つかりません</div>
          <Link 
            href="/" 
            className="text-blue-500 hover:text-blue-600"
          >
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/" 
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                ← 一覧に戻る
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.name}
                </h1>
                <p className="text-sm text-gray-600">
                  企業ID: {company.id}
                </p>
              </div>
            </div>
            
            {bestEvidence && (
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {bestEvidence.value !== null ? `${bestEvidence.value.toLocaleString()}人` : '—'}
                </p>
                <p className="text-sm text-gray-600">
                  代表値（信頼度: {bestEvidence.score ? `${(bestEvidence.score * 100).toFixed(0)}%` : '—'}）
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                証跡一覧
              </h2>
              <span className="text-sm text-gray-600">
                全{evidences.length}件
              </span>
            </div>
            
            {evidences.length > 0 ? (
              evidences.map((evidence, index) => (
                <EvidenceCard 
                  key={`${evidence.company_id}-${index}`} 
                  evidence={evidence} 
                  index={index}
                />
              ))
            ) : (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                この企業の証跡データがありません
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <DecisionControls
              reviewState={localReviewState}
              onChange={handleReviewStateChange}
              onSave={handleSave}
              hasUnsavedChanges={hasLocalChanges}
            />
          </div>
        </div>
      </main>
    </div>
  );
}