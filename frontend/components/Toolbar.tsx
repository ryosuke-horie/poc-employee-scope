'use client';

interface ToolbarProps {
  onSave: () => void;
  hasUnsavedChanges?: boolean;
}

export default function Toolbar({ onSave, hasUnsavedChanges = false }: ToolbarProps) {
  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-sm text-orange-600">未保存の変更があります</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              className={`px-4 py-2 rounded font-medium transition-colors flex items-center gap-2 ${
                hasUnsavedChanges
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!hasUnsavedChanges}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
              </svg>
              保存
            </button>
            
            <div className="text-xs text-gray-500">
              <p>保存先: ローカルストレージ</p>
              <p>キー: review_state_v1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}