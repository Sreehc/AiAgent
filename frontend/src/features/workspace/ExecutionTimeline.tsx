import { Activity, Boxes, FileText, Hammer, Radio, Route } from "lucide-react";
import { ReactNode } from "react";
import { Badge, EmptyState, Panel, StatusPill } from "../../components/ui";
import { AGENT_FEED_KIND_LABELS, ExecutionTimelineItem } from "./workspaceViewModel";
import { JsonBlock } from "./JsonBlock";

type ExecutionTimelineProps = {
  items: ExecutionTimelineItem[];
};

export function ExecutionTimeline({ items }: ExecutionTimelineProps) {
  return (
    <Panel title="Agent feed" eyebrow="Trace" action={<Badge>{items.length} events</Badge>}>
      <div className="agent-feed">
        {items.map((item) => <AgentFeedItem key={item.id} item={item} />)}
        {items.length === 0 ? <EmptyState title="暂无执行记录" message="运行研究任务后，计划、工具和产物会按时间显示在这里。" /> : null}
      </div>
    </Panel>
  );
}

function AgentFeedItem({ item }: { item: ExecutionTimelineItem }) {
  switch (item.kind) {
    case "run":
      return <RunFeedItem item={item} />;
    case "plan-step":
      return <PlanStepFeedItem item={item} />;
    case "tool":
      return <ToolFeedItem item={item} />;
    case "artifact":
      return <ArtifactFeedItem item={item} />;
    case "stream-event":
      return <StreamEventFeedItem item={item} />;
  }
}

function RunFeedItem({ item }: { item: ExecutionTimelineItem }) {
  return (
    <FeedCard item={item} className="agent-feed-card--run" icon={<Activity size={18} />} summary="研究运行">
      <FeedMeta item={item} />
      {item.detail ? <p className="agent-feed-card__error">{item.detail}</p> : null}
      <FeedPayload item={item} label="查看检索查询" />
    </FeedCard>
  );
}

function PlanStepFeedItem({ item }: { item: ExecutionTimelineItem }) {
  return (
    <FeedCard item={item} className="agent-feed-card--plan-step" icon={<Route size={18} />} summary={item.detail ?? "计划步骤"}>
      <FeedMeta item={item} />
      <FeedPayload item={item} label="查看步骤输入 / 输出" />
    </FeedCard>
  );
}

function ToolFeedItem({ item }: { item: ExecutionTimelineItem }) {
  return (
    <FeedCard item={item} className="agent-feed-card--tool" icon={<Hammer size={18} />} summary={item.detail ?? "工具调用"}>
      <FeedMeta item={item} />
      <FeedPayload item={item} label="查看工具 payload" />
    </FeedCard>
  );
}

function ArtifactFeedItem({ item }: { item: ExecutionTimelineItem }) {
  return (
    <FeedCard item={item} className="agent-feed-card--artifact" icon={<FileText size={18} />} summary={item.detail ?? "产物"}>
      <FeedMeta item={item} />
      <FeedPayload item={item} label="查看产物内容" />
    </FeedCard>
  );
}

function StreamEventFeedItem({ item }: { item: ExecutionTimelineItem }) {
  return (
    <FeedCard item={item} className="agent-feed-card--stream-event" icon={<Radio size={18} />} summary={item.detail ?? "实时事件"}>
      <FeedMeta item={item} />
      <FeedPayload item={item} label="查看实时事件" />
    </FeedCard>
  );
}

type FeedCardProps = {
  item: ExecutionTimelineItem;
  className: string;
  icon: ReactNode;
  summary: string;
  children: ReactNode;
};

function FeedCard({ item, className, icon, summary, children }: FeedCardProps) {
  return (
    <article className={`agent-feed-card ${className}`} data-kind={item.kind} data-status={normalizeFeedStatus(item.status)}>
      <div className="agent-feed-card__rail" aria-hidden="true">
        <span>{icon}</span>
      </div>
      <div className="agent-feed-card__body">
        <div className="agent-feed-card__header">
          <div className="agent-feed-card__title">
            <span className="agent-feed-card__kind">{AGENT_FEED_KIND_LABELS[item.kind]}</span>
            <strong>{item.title}</strong>
          </div>
          <StatusPill status={item.status} />
        </div>
        <div className="agent-feed-card__summary">
          <Boxes size={14} aria-hidden="true" />
          <span>{summary}</span>
          {item.timestamp ? <time>{formatDateTime(item.timestamp)}</time> : null}
        </div>
        {children}
      </div>
    </article>
  );
}

function FeedMeta({ item }: { item: ExecutionTimelineItem }) {
  if (item.metadata.length === 0) return null;
  return (
    <div className="agent-feed-card__meta">
      {item.metadata.map((entry) => <Badge key={`${item.id}-${entry.label}`} tone="neutral">{entry.label}: {entry.value}</Badge>)}
    </div>
  );
}

function FeedPayload({ item, label }: { item: ExecutionTimelineItem; label: string }) {
  return item.payload ? <JsonBlock payload={item.payload} label={label} /> : null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

function normalizeFeedStatus(status: string) {
  return status.trim().toLowerCase().replaceAll("_", "-");
}
