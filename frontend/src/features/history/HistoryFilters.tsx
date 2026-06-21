import { Button, Field, Input, Panel, Select } from "../../components/ui";

type HistoryFiltersProps = {
  keyword: string;
  status: string;
  loading?: boolean;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
};

export function HistoryFilters({ keyword, status, loading = false, onKeywordChange, onStatusChange, onRefresh }: HistoryFiltersProps) {
  return (
    <Panel title="会话筛选" eyebrow="Filter" className="history-filters" action={<Button type="button" variant="ghost" size="sm" loading={loading} disabled={loading} onClick={onRefresh}>刷新</Button>}>
      <div className="history-filter-grid">
        <Field label="关键词"><Input value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="标题 / ID / 模式" /></Field>
        <Field label="执行状态"><Select value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="">全部状态</option><option value="IDLE">空闲</option><option value="RUNNING">执行中</option><option value="PAUSED">已暂停</option><option value="COMPLETED">已完成</option><option value="FAILED">失败</option><option value="CANCELLED">已取消</option><option value="TIMED_OUT">已超时</option></Select></Field>
      </div>
    </Panel>
  );
}
