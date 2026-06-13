import { FormEvent } from "react";
import { ArtifactItem, SessionDetailResponse } from "../../services/api";
import { Button, EmptyState, Field, Input, Panel } from "../../components/ui";

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
  return (
    <Panel title="结果与产物" eyebrow="Artifacts" action={<Button type="button" variant="ghost" size="sm" disabled={!canRestore} onClick={onRestore}>恢复历史</Button>}>
      <div className="stack">
        <div className="meta-grid">
          <div className="meta-card"><span>最近执行</span><strong>{latestRun?.runId ?? "-"}</strong></div>
          <div className="meta-card"><span>模式</span><strong>{latestRun?.executionMode ?? "-"}</strong></div>
          <div className="meta-card"><span>产物数</span><strong>{artifacts.length}</strong></div>
        </div>
        {onUpload ? <form className="upload-row" onSubmit={onUpload}>
          <Field label="上传附件" description="文本类附件会登记为可复用产物。"><Input name="file" type="file" accept=".txt,.md,.csv,.json" disabled={!canRestore} /></Field>
          <Button type="submit" variant="secondary" disabled={!canRestore}>上传附件</Button>
        </form> : null}
        {latestRun?.retrievalQuery ? <div><small className="muted">检索查询</small><p>{latestRun.retrievalQuery}</p></div> : null}
        {latestRun?.finalEvidenceSet.length ? <div className="stack"><strong>最终证据</strong>{latestRun.finalEvidenceSet.map((evidence) => <article key={`${evidence.chunkId}-${evidence.rank}`} className="list-item"><div className="split"><strong>#{evidence.rank} {evidence.fileName}</strong><span className="badge badge--neutral">{evidence.score.toFixed(4)}</span></div><small>{evidence.citationId} · {evidence.retrievalStrategy}{evidence.sectionTitle ? ` · ${evidence.sectionTitle}` : ""}</small><p>{evidence.contentPreview}</p></article>)}</div> : null}
        <div className="markdown-block">{detail?.summary ?? report?.content ?? "暂无报告内容。"}</div>
        <div className="artifact-list">
          {artifacts.map((artifact) => <article key={artifact.artifactId} className="list-item"><div className="split"><strong>{artifact.title}</strong><span className="badge">{artifact.artifactType}</span></div><small>{artifact.mimeType ?? "artifact"}</small><div className="cluster">{artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : null}<Button type="button" variant="secondary" size="sm" disabled={artifact.reusable === false} onClick={() => onUseArtifact?.(artifact)}>作为上下文使用</Button></div></article>)}
          {artifacts.length === 0 ? <EmptyState message="任务完成后，报告、图片或附件会显示在这里。" /> : null}
        </div>
      </div>
    </Panel>
  );
}
