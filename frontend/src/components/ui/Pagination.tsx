import { Button } from "./Button";

type PaginationProps = {
  pageNo: number;
  hasMore: boolean;
  loading?: boolean;
  onChange: (pageNo: number) => void;
  className?: string;
};

export function Pagination({ pageNo, hasMore, loading = false, onChange, className }: PaginationProps) {
  return (
    <div className={["flex items-center justify-between gap-2", className].filter(Boolean).join(" ")}>
      <Button type="button" variant="secondary" size="sm" disabled={pageNo <= 1 || loading} onClick={() => onChange(pageNo - 1)}>
        上一页
      </Button>
      <span className="text-xs text-muted-foreground">第 {pageNo} 页</span>
      <Button type="button" variant="secondary" size="sm" disabled={!hasMore || loading} onClick={() => onChange(pageNo + 1)}>
        下一页
      </Button>
    </div>
  );
}
