import type { ReactNode } from "react";

export interface ReceiptLine {
  label: ReactNode;
  value: string;
  tone?: "save" | "warn";
}

interface ReceiptProps {
  lines: ReceiptLine[];
  total: ReceiptLine;
  label: string;
}

const TONE_CLASS = { save: "text-teal", warn: "text-warn" } as const;

/** Money breakdown drawn as a torn-off receipt. Use for savings and cart totals only. */
export function Receipt({ lines, total, label }: ReceiptProps) {
  return (
    <section className="receipt" aria-label={label}>
      {lines.map((line, i) => (
        <div key={i} className={`rline ${line.tone ? TONE_CLASS[line.tone] : ""}`}>
          <span>{line.label}</span>
          <span>{line.value}</span>
        </div>
      ))}
      <div className={`rline rline-total ${total.tone ? TONE_CLASS[total.tone] : ""}`}>
        <span>{total.label}</span>
        <span>{total.value}</span>
      </div>
    </section>
  );
}
