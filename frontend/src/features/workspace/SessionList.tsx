import { FormEvent } from "react";
import { SessionItem } from "../../services/api";
import { AgentMode } from "../../services/sessionsApi";
import { Button, EmptyState, Field, Input, Panel, Select, Skeleton, StatusPill } from "../../components/ui";

type SessionListProps = {
  sessions: SessionItem[];
  selectedSessionId: string | null;
  loading: boolean;
  creating: boolean;
  form: { title: string; agentMode: AgentMode };
  onFormChange: (form: { title: string; agentMode: AgentMode }) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSelect: (sessionId: string) => void;
  onDelete: (session: SessionItem) => void;
  onRefresh: () => void;
};

export function SessionList({ sessions, selectedSessionId, loading, creating, form, onFormChange, onCreate, onSelect, onDelete, onRefresh }: SessionListProps) {
  return (
    <aside className="stack">
      <Panel title="新建会话" eyebrow="Session">
        <form className="form-grid" onSubmit={onCreate}>
          <Field label="标题"><Input value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} placeholder="例如：新能源市场研究" required /></Field>
          <Field label="Agent 模式"><Select value={form.agentMode} onChange={(event) => onFormChange({ ...form, agentMode: event.target.value as AgentMode })}><option value="REACT">ReAct</option><option value="PLAN_EXECUTE">Plan Execute</option></Select></Field>
          <Button type="submit" variant="primary" loading={creating} fullWidth>创建会话</Button>
        </form>
      </Panel>
      <Panel title="会话列表" eyebrow="Recent" action={<Button type="button" variant="ghost" size="sm" onClick={onRefresh}>刷新</Button>}>
        <div className="list">
          {loading ? <Skeleton lines={4} compact /> : null}
          {!loading && sessions.map((item) => (
            <article key={item.sessionId} className={`session-list-item ${selectedSessionId === item.sessionId ? "session-list-item--active" : ""}`}>
              <button type="button" className="session-list-item__main" onClick={() => onSelect(item.sessionId)}>
                <strong>{item.title}</strong><span>{item.agentMode === "REACT" ? "ReAct" : "Plan Execute"}</span><small>{formatDateTime(item.createdAt)}</small>
              </button>
              <div className="split"><StatusPill status={item.status} /><Button type="button" variant="ghost" size="sm" onClick={() => onDelete(item)}>删除</Button></div>
            </article>
          ))}
          {!loading && sessions.length === 0 ? <EmptyState title="没有研究会话" message="创建一个研究主题后即可开始运行任务。" /> : null}
        </div>
      </Panel>
    </aside>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
