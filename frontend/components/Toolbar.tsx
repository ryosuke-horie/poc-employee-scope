'use client';

interface ToolbarProps {
  onSave: () => void;
  hasUnsavedChanges?: boolean;
  onToggleDiff?: () => void;
  diffMode?: boolean;
  onLoadPrevious?: () => void;
}

export default function Toolbar({ 
  onSave, 
  hasUnsavedChanges = false,
  onToggleDiff,
  diffMode = false,
  onLoadPrevious
}: ToolbarProps) {
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
            {onLoadPrevious && (
              <button
                onClick={onLoadPrevious}
                className="px-3 py-2 rounded font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm"
                title="前回データを読み込む"
              >
                前回データ読込
              </button>
            )}
            
            {onToggleDiff && (
              <button
                onClick={onToggleDiff}
                className={`px-3 py-2 rounded font-medium transition-colors flex items-center gap-2 text-sm ${
                  diffMode
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="差分表示を切り替え"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                差分表示
              </button>
            )}
            
            <div className="w-px h-6 bg-gray-300" />
            
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