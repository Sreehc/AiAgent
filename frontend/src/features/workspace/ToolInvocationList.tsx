import { ToolInvocationItem } from "../../services/api";
import { EmptyState, Panel, StatusPill } from "../../components/ui";
import { previewPayload } from "./workspaceViewModel";

export function ToolInvocationList({ items }: { items: ToolInvocationItem[] }) {
  return (
    <Panel title="工具调用账本" eyebrow="Tools" action={<span className="badge">{items.length} calls</span>}>
      <div className="timeline">
        {items.map((item) => <article key={item.toolCallId} className="timeline-item"><div className="timeline-item__header"><strong>{item.toolName}</strong><StatusPill status={item.status} /></div><p className="muted">{item.toolType} · {formatDateTime(item.startedAt)}</p><pre className="json-block">{previewPayload(item.responsePayload ?? item.requestPayload)}</pre></article>)}
        {items.length === 0 ? <EmptyState message="执行接入工具后，这里会显示调用请求和响应。" /> : null}
      </div>
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
