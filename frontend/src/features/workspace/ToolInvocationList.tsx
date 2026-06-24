import { ToolInvocationItem } from "../../services/api";
import { Badge, EmptyState, Panel, StatusPill } from "../../components/ui";
import { previewPayload } from "./workspaceViewModel";
import { JsonBlock } from "./JsonBlock";

export function ToolInvocationList({ items }: { items: ToolInvocationItem[] }) {
  return (
    <Panel title="工具调用账本" eyebrow="Tools" action={<Badge>{items.length} calls</Badge>}>
      <div className="tool-call-list">
        {items.map((item) => {
          const requestPayload = previewPayload(item.requestPayload);
          const responsePayload = previewPayload(item.responsePayload);
          const requestSummary = summarizeToolPayload(item.requestPayload);
          const responseSummary = summarizeToolPayload(item.responsePayload);
          const duration = formatDuration(item.startedAt, item.endedAt);
          return (
            <article key={item.toolCallId} className="tool-call-card">
              <div className="tool-call-card__header">
                <div>
                  <strong>{item.toolName}</strong>
                  <small>{item.toolType}</small>
                </div>
                <StatusPill status={item.status} />
              </div>
              <div className="tool-call-card__summary">
                <span><strong>开始</strong><time>{formatDateTime(item.startedAt)}</time></span>
                <span><strong>耗时</strong><span className="tabular-nums">{duration}</span></span>
                <span><strong>请求</strong><span>{requestSummary}</span></span>
                <span><strong>响应</strong><span>{responseSummary}</span></span>
              </div>
              <div className="tool-call-card__details">
                <JsonBlock payload={requestPayload} label="请求 payload" summary={requestSummary} />
                <JsonBlock payload={responsePayload} label="响应 payload" summary={responseSummary} />
              </div>
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

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "进行中";
  const startedTime = new Date(startedAt).getTime();
  const endedTime = new Date(endedAt).getTime();
  if (!Number.isFinite(startedTime) || !Number.isFinite(endedTime) || endedTime < startedTime) {
    return "-";
  }
  const durationMs = endedTime - startedTime;
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function summarizeToolPayload(payload: string | null) {
  if (!payload?.trim()) return "无数据";
  const trimmed = payload.trim();
  const parsed = parseStructuredPayload(trimmed);
  if (parsed.parseError) return "解析失败";
  if (Array.isArray(parsed.value)) return `${parsed.value.length} items`;
  if (parsed.value && typeof parsed.value === "object") return `${Object.keys(parsed.value).length} fields`;
  return `${trimmed.length} chars`;
}

function parseStructuredPayload(value: string): { value: unknown; parseError: boolean } {
  if (!value.startsWith("{") && !value.startsWith("[")) {
    return { value, parseError: false };
  }
  try {
    return { value: JSON.parse(value), parseError: false };
  } catch {
    return { value, parseError: true };
  }
}
