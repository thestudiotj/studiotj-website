interface Props {
  message: string;
  onRetry?: () => void;
}

export default function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="rounded-lg bg-red-900/30 border border-red-700/50 p-3 flex items-start gap-3">
      <span className="text-red-400 text-sm flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-red-300 hover:text-white underline whitespace-nowrap"
        >
          Retry
        </button>
      )}
    </div>
  );
}
