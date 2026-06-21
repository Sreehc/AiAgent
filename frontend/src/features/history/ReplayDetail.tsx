import { ArtifactItem, SessionDetailResponse } from "../../services/api";
import { Alert, Badge, Button, EmptyState, Panel, Skeleton, StatusPill } from "../../components/ui";
import { ExecutionTimeline } from "../workspace/ExecutionTimeline";
import { buildExecutionTimeline } from "../workspace/workspaceViewModel";

type ReplayDetailProps = {
  detail: SessionDetailResponse | null;
  loading: boolean;
  failed: boolean;
  reusingArtifactId: string | null;
  onRetry: () => void;
  onUseArtifact: (artifact: ArtifactItem) => void;
};

export function ReplayDetail({ detail, loading, failed, reusingArtifactId, onRetry, onUseArtifact }: ReplayDetailProps) {
  if (loading && !detail) return <Panel title="加载回放" eyebrow="Replay" className="replay-detail__state" state="loading"><Skeleton lines={8} /></Panel>;
  if (failed && !detail) return <Panel title="回放加载失败" eyebrow="Replay" className="replay-detail__state" state="error"><EmptyState message="无法读取该会话的执行详情。" action={<Button type="button" variant="primary" onClick={onRetry}>重新加载</Button>} /></Panel>;
  if (!detail) return <Panel title="执行回放" eyebrow="Replay" className="replay-detail__state" state="empty"><EmptyState message="选择一个历史会话，查看原始输入、执行过程、报告和产物。" /></Panel>;

  const latestRun = detail.runs[0] ?? null;
  const report = detail.artifacts.find((artifact) => artifact.artifactType === "REPORT");
  const reportContent = detail.summary ?? report?.content ?? "暂无总结或报告正文。";
  const traceItems = buildExecutionTimeline(detail);

  return (
    <div className="replay-detail">
      {loading && detail ? <Alert tone="info" title="正在刷新回放">保留当前回放内容，新的执行详情加载完成后会自动更新。</Alert> : null}
      {failed && detail ? <Alert tone="warning" title="回放刷新失败" action={<Button type="button" variant="secondary" size="sm" onClick={onRetry}>重新加载</Button>}>当前仍显示上一次成功读取的详情，筛选条件和已选会话不会被清空。</Alert> : null}

      <Panel title={detail.session.title} eyebrow="Replay summary" className="replay-summary-panel" action={<StatusPill status={detail.session.status} />}>
        <div className="replay-summary-grid">
          <div className="meta-card">
            <span>会话 ID</span>
            <strong className="id-text truncate-id" title={detail.session.sessionId}>{detail.session.sessionId}</strong>
          </div>
          <div className="meta-card">
            <span>最近执行</span>
            {latestRun ? <strong className="id-text truncate-id" title={latestRun.runId}>{latestRun.runId}</strong> : <strong>-</strong>}
          </div>
          <div className="meta-card"><span>模式</span><strong>{latestRun?.executionMode ?? detail.session.agentMode}</strong></div>
          <div className="meta-card"><span>Trace</span><strong className="tabular-nums">{traceItems.length} events</strong></div>
          <div className="meta-card"><span>工具调用</span><strong className="tabular-nums">{detail.toolInvocations.length}</strong></div>
          <div className="meta-card"><span>产物数</span><strong className="tabular-nums">{detail.artifacts.length}</strong></div>
        </div>
      </Panel>

      <section className="replay-report-section" aria-label="报告回放">
        <Panel title="报告回放" eyebrow="Report" action={<Badge tone="neutral">{detail.summary ? "summary" : report ? report.artifactType : "empty"}</Badge>}>
          {latestRun?.retrievalQuery ? <small className="muted">检索查询：{latestRun.retrievalQuery}</small> : null}
          <div className="markdown-block replay-report-body">{reportContent}</div>
        </Panel>
      </section>

      <section className="replay-trace-section" aria-label="执行 trace">
        <ExecutionTimeline items={traceItems} />
      </section>

      <Panel title="产物复用" eyebrow="Artifacts" className="replay-artifacts-panel" action={<Badge className="tabular-nums">{detail.artifacts.length} refs</Badge>}>
        <div className="replay-artifact-list">
          {detail.artifacts.map((artifact) => (
            <article key={artifact.artifactId} className="artifact-card replay-artifact-card">
              <div className="split">
                <strong>{artifact.title}</strong>
                <Badge>{artifact.artifactType}</Badge>
              </div>
              <small className="artifact-card__meta replay-artifact-card__meta">
                <span>{artifact.mimeType ?? "artifact"}</span>
                <span className="tabular-nums">{formatDateTime(artifact.createdAt)}</span>
                <span>{artifact.reusable === false ? "不可复用" : "可复用"}</span>
                <span className="id-text truncate-id" title={artifact.artifactId}>{artifact.artifactId}</span>
              </small>
              <div className="artifact-card__actions replay-artifact-card__actions">
                {artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : <span className="muted">该产物无外部文件链接。</span>}
                <Button type="button" variant="secondary" size="sm" loading={reusingArtifactId === artifact.artifactId} disabled={artifact.reusable === false || reusingArtifactId !== null} onClick={() => onUseArtifact(artifact)}>作为上下文使用</Button>
              </div>
            </article>
          ))}
          {detail.artifacts.length === 0 ? <EmptyState message="该会话暂无图片或附件产物。" /> : null}
        </div>
      </Panel>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
