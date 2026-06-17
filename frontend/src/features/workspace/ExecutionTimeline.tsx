import { Badge, EmptyState, Panel, StatusPill } from "../../components/ui";
import { ExecutionTimelineItem } from "./workspaceViewModel";
import { JsonBlock } from "./JsonBlock";

type ExecutionTimelineProps = {
  items: ExecutionTimelineItem[];
};

export function ExecutionTimeline({ items }: ExecutionTimelineProps) {
  return (
    <Panel title="执行时间线" eyebrow="Trace" action={<Badge>{items.length} events</Badge>}>
      <div className="timeline">
        {items.map((item) => (
          <article key={item.id} className={`timeline-item timeline-item--${item.kind}`}>
            <div className="timeline-item__header"><strong>{item.title}</strong><StatusPill status={item.status} /></div>
            <div className="timeline-item__meta"><span>{formatKind(item.kind)}</span>{item.timestamp ? <time>{formatDateTime(item.timestamp)}</time> : null}{item.detail ? <span>{item.detail}</span> : null}</div>
            {item.metadata.length ? <div className="cluster">{item.metadata.map((entry) => <Badge key={`${item.id}-${entry.label}`} tone="neutral">{entry.label}: {entry.value}</Badge>)}</div> : null}
            {item.payload ? <JsonBlock payload={item.payload} /> : null}
          </article>
        ))}
        {items.length === 0 ? <EmptyState title="暂无执行记录" message="运行研究任务后，计划、工具和产物会按时间显示在这里。" /> : null}
      </div>
    </Panel>
  );
}

function formatKind(kind: ExecutionTimelineItem["kind"]) {
  return { run: "运行", "plan-step": "计划步骤", tool: "工具调用", artifact: "产物", "stream-event": "实时事件" }[kind];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
