import { ErrorObject } from 'ajv';

interface ValidationErrorBannerProps {
  errors: ErrorObject[];
}

export default function ValidationErrorBanner({ errors }: ValidationErrorBannerProps) {
  if (!errors || errors.length === 0) return null;
  
  const displayErrors = errors.slice(0, 5);
  
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            スキーマ検証エラー ({errors.length}件)
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pl-5 space-y-1">
              {displayErrors.map((error, index) => (
                <li key={index}>
                  {error.instancePath || 'ルート'}: {error.message}
                </li>
              ))}
              {errors.length > 5 && (
                <li className="italic">
                  他 {errors.length - 5} 件のエラー（詳細はコンソールを確認）
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}