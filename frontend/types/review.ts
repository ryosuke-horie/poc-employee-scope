// review.schema.jsonに準拠した型定義

export interface ReviewBundle {
  generated_at: string;
  companies: Company[];
  evidence: Evidence[];
  review_state: ReviewState[];
}

export interface Company {
  id: number;
  name: string;
}

export interface Evidence {
  company_id: number;
  value: number | null;
  raw_text: string;
  source_url: string;
  source_type: 'official' | 'ir' | 'pdf' | 'gov' | 'wiki' | 'news' | 'agg' | 'web' | 'api' | 'manual';
  page_title?: string | null;
  status_code?: number | null;
  score?: number | null;
  model?: string | null;
  snippet_start?: number | null;
  snippet_end?: number | null;
  extracted_at: string;
}

export interface ReviewState {
  company_id: number;
  decision: 'ok' | 'ng' | 'unknown';
  override_value?: number | null;
  note?: string | null;
  decided_at?: string | null;
}

// UI用の拡張型
export interface CompanyWithReview extends Company {
  evidences: Evidence[];
  reviewState?: ReviewState;
  bestEvidence?: Evidence;
}