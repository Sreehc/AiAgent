import { Button, Field, Input, Panel, Select } from "../../components/ui";

type HistoryFiltersProps = {
  keyword: string;
  status: string;
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
};

export function HistoryFilters({ keyword, status, onKeywordChange, onStatusChange, onRefresh }: HistoryFiltersProps) {
  return (
    <Panel title="会话筛选" eyebrow="Filter" action={<Button type="button" variant="ghost" size="sm" onClick={onRefresh}>刷新</Button>}>
      <div className="form-grid">
        <Field label="关键词"><Input value={keyword} onChange={(event) => onKeywordChange(event.target.value)} placeholder="标题 / ID / 模式" /></Field>
        <Field label="执行状态"><Select value={status} onChange={(event) => onStatusChange(event.target.value)}><option value="">全部状态</option><option value="IDLE">空闲</option><option value="RUNNING">执行中</option><option value="COMPLETED">已完成</option><option value="FAILED">失败</option></Select></Field>
      </div>
    </Panel>
  );
}
