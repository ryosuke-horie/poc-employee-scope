import { DiffType } from '@/lib/diff';

interface DiffIndicatorProps {
  type: DiffType;
  className?: string;
}

export default function DiffIndicator({ type, className = '' }: DiffIndicatorProps) {
  if (type === 'unchanged') return null;

  const getIndicatorStyle = () => {
    switch (type) {
      case 'added':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'removed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return '';
    }
  };

  const getIndicatorText = () => {
    switch (type) {
      case 'added':
        return '新規';
      case 'removed':
        return '削除';
      case 'modified':
        return '変更';
      default:
        return '';
    }
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getIndicatorStyle()} ${className}`}
    >
      {getIndicatorText()}
    </span>
  );
}