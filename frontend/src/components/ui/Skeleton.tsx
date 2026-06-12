type SkeletonProps = {
  lines?: number;
  compact?: boolean;
};

export function Skeleton({ lines = 3, compact = false }: SkeletonProps) {
  return (
    <div className={`skeleton ${compact ? "skeleton--compact" : ""}`} aria-label="正在加载" aria-busy="true">
      {Array.from({ length: lines }, (_, index) => <span key={index} className="skeleton__line" />)}
    </div>
  );
}
