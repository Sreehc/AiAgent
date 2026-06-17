import { ToolInvocationItem } from "../../services/api";
import { Badge, EmptyState, Panel, StatusPill } from "../../components/ui";
import { previewPayload } from "./workspaceViewModel";
import { JsonBlock } from "./JsonBlock";

export function ToolInvocationList({ items }: { items: ToolInvocationItem[] }) {
  return (
    <Panel title="工具调用账本" eyebrow="Tools" action={<Badge>{items.length} calls</Badge>}>
      <div className="timeline">
        {items.map((item) => {
          const payload = previewPayload(item.responsePayload ?? item.requestPayload);
          return (
            <article key={item.toolCallId} className="timeline-item">
              <div className="timeline-item__header"><strong>{item.toolName}</strong><StatusPill status={item.status} /></div>
              <p className="muted">{item.toolType} · {formatDateTime(item.startedAt)}</p>
              {payload ? <JsonBlock payload={payload} label="查看请求 / 响应" /> : null}
            </article>
          );
        })}
        {items.length === 0 ? <EmptyState message="执行接入工具后，这里会显示调用请求和响应。" /> : null}
      </div>
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
