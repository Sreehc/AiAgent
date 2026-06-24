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
    <Panel title="历史会话" eyebrow="Sessions" className="history-session-panel" action={<Badge className="tabular-nums">{loading ? "加载中" : `${items.length} 条`}</Badge>}>
      <div className="history-session-list">
        {loading ? <Skeleton lines={5} compact /> : null}
        {!loading && items.map((item) => (
          <button
            key={item.sessionId}
            type="button"
            className={`history-session-card ${selectedId === item.sessionId ? "history-session-card--active" : ""}`}
            data-status={item.status.toLowerCase()}
            aria-pressed={selectedId === item.sessionId}
            onClick={() => onSelect(item.sessionId)}
          >
            <div className="history-session-card__header">
              <strong>{item.title}</strong>
              <StatusPill status={item.status} />
            </div>
            <span className="id-text truncate-id" title={item.sessionId}>{item.sessionId}</span>
            <small>
              <span>{item.agentMode}</span>
              <span className="tabular-nums">{formatDateTime(item.createdAt)}</span>
            </small>
          </button>
        ))}
        {!loading && items.length === 0 ? <EmptyState title="没有匹配会话" message="调整关键词或状态筛选，或先在研究工作台运行任务。" /> : null}
      </div>
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
