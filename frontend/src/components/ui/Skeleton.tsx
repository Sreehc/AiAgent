import { cn } from "@/lib/utils";

type SkeletonProps = {
  lines?: number;
  compact?: boolean;
  variant?: "list" | "table" | "card" | "feed" | "form";
  label?: string;
  className?: string;
};

const skeletonBar = "animate-pulse motion-reduce:animate-none rounded bg-muted";

const skeletonVariants = {
  list: (lines: number, compact: boolean) => (
    <div className={cn("flex flex-col", compact ? "gap-1.5" : "gap-2.5")}>
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={cn(skeletonBar, compact ? "h-2.5" : "h-3", "w-full")} />
      ))}
    </div>
  ),
  table: (lines: number, compact: boolean) => (
    <div className={cn("grid", compact ? "gap-2" : "gap-3")}>
      {Array.from({ length: lines }, (_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-[1.4fr_0.8fr_0.6fr] gap-3">
          <span className={cn(skeletonBar, "h-3")} />
          <span className={cn(skeletonBar, "h-3")} />
          <span className={cn(skeletonBar, "h-3")} />
        </div>
      ))}
    </div>
  ),
  card: (lines: number) => (
    <div className="grid gap-3">
      <span className={cn(skeletonBar, "h-24 w-full rounded-md")} />
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={cn(skeletonBar, "h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  ),
  feed: (lines: number) => (
    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
      <span className={cn(skeletonBar, "h-8 w-8 rounded-full")} />
      <div className="grid gap-2">
        {Array.from({ length: lines }, (_, index) => (
          <span key={index} className={cn(skeletonBar, "h-3", index === lines - 1 ? "w-3/4" : "w-full")} />
        ))}
      </div>
    </div>
  ),
  form: (lines: number) => (
    <div className="grid gap-4">
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="grid gap-2">
          <span className={cn(skeletonBar, "h-3 w-24")} />
          <span className={cn(skeletonBar, "h-10 w-full rounded-md")} />
        </div>
      ))}
    </div>
  )
};

export function Skeleton({ lines = 3, compact = false, variant = "list", label = "正在加载", className }: SkeletonProps) {
  return (
    <div className={className} aria-label={label} aria-busy="true" role="status">
      {skeletonVariants[variant](lines, compact)}
    </div>
  );
}
