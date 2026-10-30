import { useCallback, useEffect, useState } from "react";

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [message, key]);

  const show = useCallback((text: string) => {
    setMessage(text);
    setKey((k) => k + 1);
  }, []);

  return { message, show };
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 z-20 max-w-[90%] -translate-x-1/2 text-center"
      style={{ bottom: "calc(88px + env(safe-area-inset-bottom, 0px))" }}
    >
      {message && (
        <div className="bg-ink text-page rounded-full px-4 py-2.5 text-sm font-bold">{message}</div>
      )}
    </div>
  );
}
