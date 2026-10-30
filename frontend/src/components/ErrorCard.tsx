interface ErrorCardProps {
  message: string;
  onRetry: () => void;
  onUseSample?: () => void;
}

/** Friendly failure with a way forward. Never a raw error. */
export function ErrorCard({ message, onRetry, onUseSample }: ErrorCardProps) {
  return (
    <div className="card flex flex-col gap-3" role="alert">
      <h3>Prices didn't load</h3>
      <p className="text-muted text-sm">
        {message} You can try again, or keep going with sample Ann Arbor prices.
      </p>
      <div className="flex flex-col gap-2">
        {onUseSample && (
          <button type="button" className="btn btn-primary" onClick={onUseSample}>
            Use sample prices
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
