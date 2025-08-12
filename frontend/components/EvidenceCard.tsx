import { Evidence } from '@/types/review';
import { useReview } from '@/contexts/ReviewContext';
import { hasEvidenceDiff } from '@/lib/diff';
import DiffIndicator from './DiffIndicator';

interface EvidenceCardProps {
  evidence: Evidence;
  index: number;
}

export default function EvidenceCard({ evidence, index }: EvidenceCardProps) {
  const { diffMode, diff } = useReview();
  const sourceTypeLabels: Record<string, string> = {
    official: '公式サイト',
    ir: 'IR情報',
    pdf: 'PDFドキュメント',
    gov: '政府機関',
    wiki: 'Wikipedia',
    news: 'ニュース',
    agg: '集約サイト',
    web: 'ウェブサイト',
    api: 'API',
    manual: '手動入力',
  };

  const getStatusColor = (statusCode?: number | null) => {
    if (!statusCode) return 'bg-gray-100 text-gray-800';
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-100 text-green-800';
    if (statusCode >= 400) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const extractionMethod = evidence.model || (evidence.value ? 'regex' : 'failed');
  const evidenceDiffType = diffMode && diff ? hasEvidenceDiff(evidence.company_id, index, diff) : 'unchanged';

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${
      evidenceDiffType !== 'unchanged' ? 'ring-2 ring-yellow-400' : ''
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-gray-500">証跡 #{index + 1}</span>
            {evidenceDiffType !== 'unchanged' && (
              <DiffIndicator type={evidenceDiffType} />
            )}
            <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
              {sourceTypeLabels[evidence.source_type] || evidence.source_type}
            </span>
            {evidence.status_code && (
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(evidence.status_code)}`}>
                HTTP {evidence.status_code}
              </span>
            )}
          </div>
          
          {evidence.value !== null ? (
            <p className="text-2xl font-bold text-gray-900">{evidence.value.toLocaleString()}人</p>
          ) : (
            <p className="text-lg text-gray-500">抽出失敗</p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>信頼度: {evidence.score ? `${(evidence.score * 100).toFixed(0)}%` : '—'}</span>
            <span>抽出方法: {extractionMethod}</span>
          </div>
        </div>
      </div>

      {evidence.page_title && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700">{evidence.page_title}</p>
        </div>
      )}

      {evidence.raw_text && (
        <details className="mb-4">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
            抽出テキストを表示
          </summary>
          <div className="mt-2 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {evidence.raw_text.length > 500 
                ? `${evidence.raw_text.substring(0, 500)}...` 
                : evidence.raw_text}
            </p>
          </div>
        </details>
      )}

      <div className="border-t pt-3 text-sm text-gray-600 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">URL:</span>
          <a 
            href={evidence.source_url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-500 hover:underline truncate flex-1"
            title={evidence.source_url}
          >
            {evidence.source_url}
          </a>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-medium">取得日時:</span>
          <span>{new Date(evidence.extracted_at).toLocaleString('ja-JP')}</span>
        </div>
      </div>
    </div>
  );
}