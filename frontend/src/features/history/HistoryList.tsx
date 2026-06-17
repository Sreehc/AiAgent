import { SessionItem } from "../../services/api";
import { Badge, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";

type HistoryListProps = {
  items: SessionItem[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (sessionId: string) => void;
};

export function HistoryList({ items, selectedId, loading, onSelect }: HistoryListProps) {
  return (
    <Panel title="历史会话" eyebrow="Sessions" action={<Badge>{loading ? "加载中" : `${items.length} 条`}</Badge>}>
      <div className="list">
        {loading ? <Skeleton lines={5} compact /> : null}
        {!loading && items.map((item) => <button key={item.sessionId} type="button" className={`list-item ${selectedId === item.sessionId ? "list-item--active" : ""}`} onClick={() => onSelect(item.sessionId)}><div className="split"><strong>{item.title}</strong><StatusPill status={item.status} /></div><span>{item.sessionId}</span><small>{item.agentMode} · {formatDateTime(item.createdAt)}</small></button>)}
        {!loading && items.length === 0 ? <EmptyState title="没有匹配会话" message="调整关键词或状态筛选，或先在研究工作台运行任务。" /> : null}
      </div>
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
