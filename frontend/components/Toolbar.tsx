'use client';

import { useRef } from 'react';
import { ReviewBundle } from '@/types/review';

interface ToolbarProps {
  reviewData: ReviewBundle;
  onSave: (data: ReviewBundle) => void;
  onImport: (file: File) => void;
}

export default function Toolbar({ reviewData, onSave, onImport }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleExportCSV = () => {
    // CSV形式でエクスポート
    const rows = [
      ['company_id', 'company_name', 'decision', 'override_value', 'final_value', 'note', 'decided_at'],
    ];

    reviewData.companies.forEach(company => {
      const reviewState = reviewData.review_state.find(r => r.company_id === company.id);
      const evidences = reviewData.evidence.filter(e => e.company_id === company.id);
      const bestEvidence = evidences
        .filter(e => e.value !== null)
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      
      const finalValue = reviewState?.override_value ?? bestEvidence?.value ?? '';
      
      rows.push([
        company.id.toString(),
        company.name,
        reviewState?.decision || '',
        reviewState?.override_value?.toString() || '',
        finalValue.toString(),
        reviewState?.note || '',
        reviewState?.decided_at || '',
      ]);
    });

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSave(reviewData)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
            </svg>
            JSONを保存
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            JSONをインポート
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSVエクスポート
          </button>

          <div className="ml-auto text-sm text-gray-600">
            総企業数: {reviewData.companies.length} / 
            総証跡数: {reviewData.evidence.length}
          </div>
        </div>
      </div>
    </div>
  );
}