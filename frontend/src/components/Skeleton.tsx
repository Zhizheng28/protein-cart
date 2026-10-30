export function SkeletonLine({ width = "100%", height = 14 }: { width?: string; height?: number }) {
  return <div className="skeleton" style={{ width, height }} />;
}

/** Placeholder for a screen while prices load. */
export function ScreenSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label={label}>
      <div className="flex flex-col gap-2">
        <SkeletonLine width="35%" height={12} />
        <SkeletonLine width="70%" height={24} />
      </div>
      <div className="card flex flex-col gap-3">
        <SkeletonLine width="50%" />
        <SkeletonLine width="40%" height={40} />
        <SkeletonLine width="80%" height={12} />
      </div>
      <div className="card flex flex-col gap-3">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine width="60%" />
      </div>
      <p className="note">{label}</p>
    </div>
  );
}
