import { PROTEIN_LABELS } from "../food";
import type { ProteinSource } from "../types";

export function ProteinTag({ source, count }: { source: ProteinSource; count?: number }) {
  return (
    <span className={`tag tag-${source}`}>
      {PROTEIN_LABELS[source]}
      {count !== undefined && <span className="num">×{count}</span>}
    </span>
  );
}
