import { ArtifactItem, SessionDetailResponse } from "../../services/api";
import { Button, EmptyState, Panel } from "../../components/ui";

type ArtifactPanelProps = {
  detail: SessionDetailResponse | null;
  artifacts: ArtifactItem[];
  onRestore: () => void;
  canRestore: boolean;
};

export function ArtifactPanel({ detail, artifacts, onRestore, canRestore }: ArtifactPanelProps) {
  const report = artifacts.find((artifact) => artifact.artifactType === "REPORT");
  return (
    <Panel title="结果与产物" eyebrow="Artifacts" action={<Button type="button" variant="ghost" size="sm" disabled={!canRestore} onClick={onRestore}>恢复历史</Button>}>
      <div className="stack">
        <div className="meta-grid">
          <div className="meta-card"><span>最近执行</span><strong>{detail?.runs[0]?.runId ?? "-"}</strong></div>
          <div className="meta-card"><span>模式</span><strong>{detail?.runs[0]?.executionMode ?? "-"}</strong></div>
          <div className="meta-card"><span>产物数</span><strong>{artifacts.length}</strong></div>
        </div>
        <div className="markdown-block">{detail?.summary ?? report?.content ?? "暂无报告内容。"}</div>
        <div className="artifact-list">
          {artifacts.map((artifact) => <article key={artifact.artifactId} className="list-item"><div className="split"><strong>{artifact.title}</strong><span className="badge">{artifact.artifactType}</span></div><small>{artifact.mimeType ?? "artifact"}</small>{artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : null}</article>)}
          {artifacts.length === 0 ? <EmptyState message="任务完成后，报告、图片或附件会显示在这里。" /> : null}
        </div>
      </div>
    </Panel>
  );
}
