import { FormEvent } from "react";
import { ArtifactItem, SessionDetailResponse } from "../../services/api";
import { Badge, Button, EmptyState, Field, Input, Panel } from "../../components/ui";

type ArtifactPanelProps = {
  detail: SessionDetailResponse | null;
  artifacts: ArtifactItem[];
  onRestore: () => void;
  canRestore: boolean;
  onUseArtifact?: (artifact: ArtifactItem) => void;
  onUpload?: (event: FormEvent<HTMLFormElement>) => void;
};

export function ArtifactPanel({ detail, artifacts, onRestore, canRestore, onUseArtifact, onUpload }: ArtifactPanelProps) {
  const report = artifacts.find((artifact) => artifact.artifactType === "REPORT");
  const latestRun = detail?.runs[0];
  const reportContent = detail?.summary ?? report?.content ?? "";
  return (
    <Panel title="结果与产物" eyebrow="Artifacts" action={<Button type="button" variant="ghost" size="sm" disabled={!canRestore} onClick={onRestore}>恢复历史</Button>}>
      <div className="stack">
        <div className="artifact-summary-grid">
          <div className="meta-card">
            <span>最近执行</span>
            {latestRun ? <strong className="id-text truncate-id" title={latestRun.runId}>{latestRun.runId}</strong> : <strong>-</strong>}
          </div>
          <div className="meta-card"><span>报告来源</span><strong>{detail?.summary ? "运行摘要" : report ? "报告产物" : "-"}</strong></div>
          <div className="meta-card"><span>产物数</span><strong className="tabular-nums">{artifacts.length}</strong></div>
        </div>
        <section className="report-preview" aria-label="报告预览">
          <div className="split">
            <strong>报告预览</strong>
            <Badge tone="neutral">{latestRun?.status ?? "IDLE"}</Badge>
          </div>
          {latestRun?.retrievalQuery ? <small className="muted">检索查询：{latestRun.retrievalQuery}</small> : null}
          <div className="markdown-block">{reportContent || "暂无报告内容。"}</div>
        </section>
        {onUpload ? <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传附件" description="文本类附件会登记为可复用产物。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!canRestore} /></Field>
          <Button type="submit" variant="secondary" disabled={!canRestore}>上传附件</Button>
        </form> : null}
        <div className="artifact-list">
          {artifacts.map((artifact) => (
            <article key={artifact.artifactId} className="artifact-card">
              <div className="split">
                <strong>{artifact.title}</strong>
                <Badge>{artifact.artifactType}</Badge>
              </div>
              <small className="artifact-card__meta">
                <span>{artifact.mimeType ?? "artifact"}</span>
                <span className="tabular-nums">{formatDateTime(artifact.createdAt)}</span>
                <span>{artifact.reusable === false ? "不可复用" : "可复用"}</span>
              </small>
              <div className="artifact-card__actions">
                {artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : null}
                <Button type="button" variant="secondary" size="sm" disabled={artifact.reusable === false} onClick={() => onUseArtifact?.(artifact)}>作为上下文使用</Button>
              </div>
            </article>
          ))}
          {artifacts.length === 0 ? <EmptyState message="任务完成后，报告、图片或附件会显示在这里。" /> : null}
        </div>
      </div>
    </Panel>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
