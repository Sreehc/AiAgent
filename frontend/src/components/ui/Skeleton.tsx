import { cn } from "@/lib/utils";

type SkeletonProps = {
  lines?: number;
  compact?: boolean;
};

export function Skeleton({ lines = 3, compact = false }: SkeletonProps) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2.5")} aria-label="正在加载" aria-busy="true">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className="h-3 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
