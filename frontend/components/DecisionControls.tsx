import { ReviewState } from '@/types/review';

interface DecisionControlsProps {
  reviewState: ReviewState;
  onChange: (reviewState: Partial<ReviewState>) => void;
  onSave: () => void;
  hasUnsavedChanges?: boolean;
}

export default function DecisionControls({ 
  reviewState, 
  onChange, 
  onSave,
  hasUnsavedChanges = false 
}: DecisionControlsProps) {
  const decisionOptions = [
    { value: 'ok', label: 'OK', color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'ng', label: 'NG', color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'unknown', label: '不明', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  ] as const;

  const currentDecision = decisionOptions.find(opt => opt.value === reviewState.decision);

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">レビュー判定</h2>
        {hasUnsavedChanges && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            未保存の変更
          </span>
        )}
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            判定 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {decisionOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onChange({ decision: option.value })}
                className={`px-3 py-2 rounded border transition-all ${
                  reviewState.decision === option.value
                    ? `${option.bgColor} ${option.color} border-current font-medium`
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上書き値（任意）
          </label>
          <input
            type="number"
            value={reviewState.override_value ?? ''}
            onChange={(e) => onChange({ 
              override_value: e.target.value ? parseInt(e.target.value) : null 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 1000"
            min="0"
          />
          <p className="mt-1 text-xs text-gray-500">
            抽出値と異なる場合に入力してください
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メモ（任意）
          </label>
          <textarea
            value={reviewState.note ?? ''}
            onChange={(e) => onChange({ 
              note: e.target.value || null 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="判定理由や補足情報を入力..."
          />
        </div>

        {reviewState.decided_at && (
          <div className="text-xs text-gray-500 border-t pt-3">
            最終更新: {new Date(reviewState.decided_at).toLocaleString('ja-JP')}
          </div>
        )}

        <button
          onClick={onSave}
          className={`w-full px-4 py-2 rounded transition-colors ${
            hasUnsavedChanges
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!hasUnsavedChanges}
        >
          ローカルストレージに保存
        </button>

        {currentDecision && (
          <div className={`text-center p-2 rounded ${currentDecision.bgColor}`}>
            <span className={`font-medium ${currentDecision.color}`}>
              現在の判定: {currentDecision.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}