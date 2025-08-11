'use client';

import { useState, useEffect } from 'react';
import { ReviewBundle, CompanyWithReview } from '@/types/review';
import CompanyList from '@/components/CompanyList';
import Filters from '@/components/Filters';
import Toolbar from '@/components/Toolbar';
import ValidationErrorBanner from '@/components/ValidationErrorBanner';
import { validateReview } from '@/lib/validation';
import { ErrorObject } from 'ajv';

export default function HomePage() {
  const [reviewData, setReviewData] = useState<ReviewBundle | null>(null);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyWithReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ErrorObject[]>([]);

  // review.jsonを読み込む
  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // public/review.jsonから読み込み
      const response = await fetch('/review.json');
      if (!response.ok) {
        throw new Error(`Failed to load review.json: ${response.status}`);
      }
      
      const data: ReviewBundle = await response.json();
      
      // スキーマ検証
      const validationResult = await validateReview(data);
      if (!validationResult.valid) {
        setValidationErrors(validationResult.errors || []);
        console.error('Schema validation errors:', validationResult.errors);
        // 検証エラーがある場合は描画を中断
        return;
      }
      
      setValidationErrors([]);
      setReviewData(data);
      
      // 企業データを整形
      const companiesWithReview = processCompanies(data);
      setFilteredCompanies(companiesWithReview);
      
    } catch (err) {
      console.error('Error loading review data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load review data');
    } finally {
      setLoading(false);
    }
  };

  const processCompanies = (data: ReviewBundle): CompanyWithReview[] => {
    return data.companies.map(company => {
      const evidences = data.evidence.filter(e => e.company_id === company.id);
      const reviewState = data.review_state.find(r => r.company_id === company.id);
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
  };

  const handleSave = async (updatedData: ReviewBundle) => {
    // 保存前にスキーマ検証
    const validationResult = await validateReview(updatedData);
    if (!validationResult.valid) {
      setValidationErrors(validationResult.errors || []);
      console.error('Schema validation errors before save:', validationResult.errors);
      // 検証エラーがある場合は保存を中断
      return;
    }
    
    setValidationErrors([]);
    
    // localStorageに保存
    try {
      localStorage.setItem('review_state_v1', JSON.stringify(updatedData));
      console.log('Data saved to localStorage');
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      setError('Failed to save data');
    }
    
    // JSONダウンロード
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

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ReviewBundle;
        
        // インポート時もスキーマ検証
        const validationResult = await validateReview(data);
        if (!validationResult.valid) {
          setValidationErrors(validationResult.errors || []);
          console.error('Schema validation errors on import:', validationResult.errors);
          return;
        }
        
        setValidationErrors([]);
        setReviewData(data);
        const companiesWithReview = processCompanies(data);
        setFilteredCompanies(companiesWithReview);
      } catch (err) {
        setError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">データを読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={loadReviewData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">データがありません</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {validationErrors.length > 0 && (
        <ValidationErrorBanner errors={validationErrors} />
      )}
      
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            従業員数レビューシステム
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            生成日時: {new Date(reviewData.generated_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </header>

      <Toolbar
        reviewData={reviewData}
        onSave={handleSave}
        onImport={handleImport}
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
            <CompanyList
              companies={filteredCompanies}
              reviewData={reviewData}
              onUpdateReview={(companyId, reviewState) => {
                // レビュー状態を更新
                const updatedReviewState = reviewData.review_state.map(r =>
                  r.company_id === companyId ? { ...reviewState, company_id: companyId } : r
                );
                
                // 新規の場合は追加
                if (!reviewData.review_state.find(r => r.company_id === companyId)) {
                  updatedReviewState.push({ ...reviewState, company_id: companyId });
                }
                
                const updatedData = {
                  ...reviewData,
                  review_state: updatedReviewState,
                };
                
                setReviewData(updatedData);
                
                // 状態更新時もlocalStorageに保存
                validateReview(updatedData).then(result => {
                  if (result.valid) {
                    localStorage.setItem('review_state_v1', JSON.stringify(updatedData));
                    setValidationErrors([]);
                  } else {
                    setValidationErrors(result.errors || []);
                    console.error('Validation errors on update:', result.errors);
                  }
                });
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}