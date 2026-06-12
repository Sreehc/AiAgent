import { SessionDetailResponse } from "../../services/api";
import { Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";
import { ExecutionTimeline } from "../workspace/ExecutionTimeline";
import { buildExecutionTimeline } from "../workspace/workspaceViewModel";

type ReplayDetailProps = {
  detail: SessionDetailResponse | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

export function ReplayDetail({ detail, loading, failed, onRetry }: ReplayDetailProps) {
  if (loading && !detail) return <Panel title="加载回放" eyebrow="Replay"><Skeleton lines={8} /></Panel>;
  if (failed && !detail) return <Panel title="回放加载失败" eyebrow="Replay"><EmptyState message="无法读取该会话的执行详情。" action={<Button type="button" variant="primary" onClick={onRetry}>重新加载</Button>} /></Panel>;
  if (!detail) return <Panel title="执行回放" eyebrow="Replay"><EmptyState message="选择一个历史会话，查看原始输入、执行过程、报告和产物。" /></Panel>;

  const report = detail.artifacts.find((artifact) => artifact.artifactType === "REPORT");
  const references = detail.artifacts.filter((artifact) => artifact.artifactType !== "REPORT");
  return (
    <div className="stack">
      <Panel title={detail.session.title} eyebrow="Replay summary" action={<StatusPill status={detail.session.status} />}>
        <div className="stack">
          <div className="meta-grid"><div className="meta-card"><span>最近执行</span><strong>{detail.runs[0]?.runId ?? "-"}</strong></div><div className="meta-card"><span>模式</span><strong>{detail.runs[0]?.executionMode ?? "-"}</strong></div><div className="meta-card"><span>产物数</span><strong>{detail.artifacts.length}</strong></div></div>
          <div className="markdown-block">{detail.summary ?? report?.content ?? "暂无总结或报告正文。"}</div>
        </div>
      </Panel>
      <ExecutionTimeline items={buildExecutionTimeline(detail)} />
      <Panel title="产物引用" eyebrow="Artifacts" action={<span className="badge">{references.length} refs</span>}>
        <div className="artifact-list">
          {references.map((artifact) => <article key={artifact.artifactId} className="list-item"><div className="split"><strong>{artifact.title}</strong><span className="badge">{artifact.artifactType}</span></div><small>{artifact.mimeType ?? "artifact"}</small>{artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : <span className="muted">该产物无外部文件链接。</span>}</article>)}
          {references.length === 0 ? <EmptyState message="该会话暂无图片或附件产物。" /> : null}
        </div>
      </Panel>
    </div>
  );
}
