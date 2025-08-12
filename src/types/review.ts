/**
 * レビューシステムの共通型定義
 */

export interface Company {
  id: number;
  name: string;
}

export interface Evidence {
  company_id: number;
  source_url: string;
  source_type?: string;
  value: number | null;
  raw_text: string;
  model: string | null;
  score: number | null;
  page_title: string | null;
  extracted_at: string;
  status_code: number | null;
  snippet_start: number | null;
  snippet_end: number | null;
}

export interface ReviewState {
  company_id: number;
  decision: 'ok' | 'ng' | 'unknown';
  override_value: number | null;
  note: string | null;
  decided_at?: string;
}

export interface ReviewBundle {
  generated_at: string;
  companies: Company[];
  evidence: Evidence[];
  review_state: ReviewState[];
}