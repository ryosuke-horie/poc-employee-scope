'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ReviewBundle, ReviewState, Company, Evidence } from '@/types/review';
import { detectDifferences, ReviewDiff } from '@/lib/diff';

// アクションタイプ
type ReviewAction =
  | { type: 'SET_DATA'; payload: ReviewBundle }
  | { type: 'UPDATE_REVIEW_STATE'; companyId: number; reviewState: ReviewState }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_PREVIOUS_DATA'; payload: ReviewBundle | null }
  | { type: 'TOGGLE_DIFF_MODE' }
  | { type: 'RESET' };

// ステートの型定義
interface ReviewContextState {
  reviewData: ReviewBundle | null;
  previousData: ReviewBundle | null;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  diffMode: boolean;
  diff: ReviewDiff | null;
}

// Contextの型定義
interface ReviewContextValue extends ReviewContextState {
  dispatch: React.Dispatch<ReviewAction>;
  updateReviewState: (companyId: number, reviewState: Partial<ReviewState>) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  loadPreviousData: () => void;
  toggleDiffMode: () => void;
  getBestEvidence: (companyId: number) => Evidence | undefined;
  getCompanyWithReview: (companyId: number) => {
    company: Company | undefined;
    evidences: Evidence[];
    reviewState: ReviewState | undefined;
    bestEvidence: Evidence | undefined;
  };
}

// 初期状態
const initialState: ReviewContextState = {
  reviewData: null,
  previousData: null,
  loading: false,
  error: null,
  hasUnsavedChanges: false,
  diffMode: false,
  diff: null,
};

// Reducer
function reviewReducer(state: ReviewContextState, action: ReviewAction): ReviewContextState {
  switch (action.type) {
    case 'SET_DATA': {
      const diff = state.previousData ? detectDifferences(state.previousData, action.payload) : null;
      return {
        ...state,
        reviewData: action.payload,
        diff,
        error: null,
      };
    }
    
    case 'UPDATE_REVIEW_STATE': {
      if (!state.reviewData) return state;
      
      const existingIndex = state.reviewData.review_state.findIndex(
        r => r.company_id === action.companyId
      );
      
      const updatedReviewState = [...state.reviewData.review_state];
      
      if (existingIndex >= 0) {
        updatedReviewState[existingIndex] = action.reviewState;
      } else {
        updatedReviewState.push(action.reviewState);
      }
      
      return {
        ...state,
        reviewData: {
          ...state.reviewData,
          review_state: updatedReviewState,
        },
        hasUnsavedChanges: true,
      };
    }
    
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    
    case 'SET_PREVIOUS_DATA': {
      const diff = state.reviewData && action.payload 
        ? detectDifferences(action.payload, state.reviewData) 
        : null;
      return { 
        ...state, 
        previousData: action.payload,
        diff,
      };
    }
    
    case 'TOGGLE_DIFF_MODE':
      return { ...state, diffMode: !state.diffMode };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

// Context作成
const ReviewContext = createContext<ReviewContextValue | undefined>(undefined);

// Provider コンポーネント
export function ReviewProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reviewReducer, initialState);

  // localStorage への保存
  const saveToLocalStorage = () => {
    if (state.reviewData) {
      try {
        localStorage.setItem('review_state_v1', JSON.stringify(state.reviewData));
        dispatch({ type: 'SET_DATA', payload: state.reviewData }); // hasUnsavedChangesをリセット
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        dispatch({ type: 'SET_ERROR', error: 'ローカルストレージへの保存に失敗しました' });
      }
    }
  };

  // localStorage からの読み込み
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('review_state_v1');
      if (saved) {
        const data = JSON.parse(saved) as ReviewBundle;
        dispatch({ type: 'SET_DATA', payload: data });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return false;
    }
  };

  // 前回データの読み込み
  const loadPreviousData = () => {
    try {
      const saved = localStorage.getItem('review_state_previous');
      if (saved) {
        const data = JSON.parse(saved) as ReviewBundle;
        dispatch({ type: 'SET_PREVIOUS_DATA', payload: data });
      }
    } catch (error) {
      console.error('Failed to load previous data from localStorage:', error);
    }
  };

  // 差分モードの切り替え
  const toggleDiffMode = () => {
    dispatch({ type: 'TOGGLE_DIFF_MODE' });
  };

  // レビュー状態の更新
  const updateReviewState = (companyId: number, reviewState: Partial<ReviewState>) => {
    const fullReviewState: ReviewState = {
      company_id: companyId,
      decision: reviewState.decision || 'unknown',
      override_value: reviewState.override_value !== undefined ? reviewState.override_value : null,
      note: reviewState.note !== undefined ? reviewState.note : null,
      decided_at: new Date().toISOString(),
    };
    
    dispatch({ type: 'UPDATE_REVIEW_STATE', companyId, reviewState: fullReviewState });
  };

  // 代表evidenceを取得
  const getBestEvidence = (companyId: number): Evidence | undefined => {
    if (!state.reviewData) return undefined;
    
    const evidences = state.reviewData.evidence.filter(e => e.company_id === companyId);
    
    // value != null を優先、その後scoreとextracted_atでソート
    const sorted = evidences
      .sort((a, b) => {
        // value != nullを優先
        if (a.value !== null && b.value === null) return -1;
        if (a.value === null && b.value !== null) return 1;
        
        // scoreで降順ソート
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // extracted_atで降順ソート
        return new Date(b.extracted_at).getTime() - new Date(a.extracted_at).getTime();
      });
    
    return sorted[0];
  };

  // 企業情報をevidenceとreview_stateを含めて取得
  const getCompanyWithReview = (companyId: number) => {
    const company = state.reviewData?.companies.find(c => c.id === companyId);
    const evidences = state.reviewData?.evidence.filter(e => e.company_id === companyId) || [];
    const reviewState = state.reviewData?.review_state.find(r => r.company_id === companyId);
    const bestEvidence = getBestEvidence(companyId);
    
    return {
      company,
      evidences,
      reviewState,
      bestEvidence,
    };
  };

  const value: ReviewContextValue = {
    ...state,
    dispatch,
    updateReviewState,
    saveToLocalStorage,
    loadFromLocalStorage,
    loadPreviousData,
    toggleDiffMode,
    getBestEvidence,
    getCompanyWithReview,
  };

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

// Custom hook
export function useReview() {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReview must be used within a ReviewProvider');
  }
  return context;
}