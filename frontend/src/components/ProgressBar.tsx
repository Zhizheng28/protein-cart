import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  tone?: "maize" | "teal";
  /** Spring forward when the value grows (the goal bar after banking). */
  spring?: boolean;
}

export function ProgressBar({
  value,
  max,
  label,
  tone = "maize",
  spring = false,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const previous = useRef(pct);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (spring && pct > previous.current) setAnimate(true);
    previous.current = pct;
  }, [pct, spring]);

  return (
    <div
      className={`bar ${tone === "teal" ? "bar-teal" : ""}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <span
        className={animate ? "spring" : undefined}
        style={{ width: `${pct}%` }}
        onTransitionEnd={() => setAnimate(false)}
      />
    </div>
  );
}
