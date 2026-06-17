import { ArtifactItem, SessionDetailResponse } from "../../services/api";
import { Badge, Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";
import { ExecutionTimeline } from "../workspace/ExecutionTimeline";
import { buildExecutionTimeline } from "../workspace/workspaceViewModel";

type ReplayDetailProps = {
  detail: SessionDetailResponse | null;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  onUseArtifact: (artifact: ArtifactItem) => void;
};

export function ReplayDetail({ detail, loading, failed, onRetry, onUseArtifact }: ReplayDetailProps) {
  if (loading && !detail) return <Panel title="加载回放" eyebrow="Replay"><Skeleton lines={8} /></Panel>;
  if (failed && !detail) return <Panel title="回放加载失败" eyebrow="Replay"><EmptyState message="无法读取该会话的执行详情。" action={<Button type="button" variant="primary" onClick={onRetry}>重新加载</Button>} /></Panel>;
  if (!detail) return <Panel title="执行回放" eyebrow="Replay"><EmptyState message="选择一个历史会话，查看原始输入、执行过程、报告和产物。" /></Panel>;

  const report = detail.artifacts.find((artifact) => artifact.artifactType === "REPORT");
  const references = detail.artifacts;
  return (
    <div className="stack">
      <Panel title={detail.session.title} eyebrow="Replay summary" action={<StatusPill status={detail.session.status} />}>
        <div className="stack">
          <div className="meta-grid"><div className="meta-card"><span>最近执行</span><strong>{detail.runs[0]?.runId ?? "-"}</strong></div><div className="meta-card"><span>模式</span><strong>{detail.runs[0]?.executionMode ?? "-"}</strong></div><div className="meta-card"><span>产物数</span><strong>{detail.artifacts.length}</strong></div></div>
          <div className="markdown-block">{detail.summary ?? report?.content ?? "暂无总结或报告正文。"}</div>
        </div>
      </Panel>
      <ExecutionTimeline items={buildExecutionTimeline(detail)} />
      <Panel title="产物引用" eyebrow="Artifacts" action={<Badge>{references.length} refs</Badge>}>
        <div className="artifact-list">
          {references.map((artifact) => <article key={artifact.artifactId} className="list-item"><div className="split"><strong>{artifact.title}</strong><Badge>{artifact.artifactType}</Badge></div><small>{artifact.mimeType ?? "artifact"}</small><div className="cluster">{artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : <span className="muted">该产物无外部文件链接。</span>}<Button type="button" variant="secondary" size="sm" disabled={artifact.reusable === false} onClick={() => onUseArtifact(artifact)}>作为上下文使用</Button></div></article>)}
          {references.length === 0 ? <EmptyState message="该会话暂无图片或附件产物。" /> : null}
        </div>
      </Panel>
    </div>
  );
}
