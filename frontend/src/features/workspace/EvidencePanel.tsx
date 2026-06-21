import { EvidenceItem, SessionDetailResponse } from "../../services/api";
import { Badge, EmptyState, Panel } from "../../components/ui";

type EvidencePanelProps = {
  selected: boolean;
  detail: SessionDetailResponse | null;
};

export function EvidencePanel({ selected, detail }: EvidencePanelProps) {
  const latestRun = detail?.runs[0] ?? null;
  const finalEvidenceSet = latestRun?.finalEvidenceSet ?? [];
  const recallSet = latestRun?.recallSet ?? [];
  const hasEvidence = finalEvidenceSet.length > 0 || recallSet.length > 0;

  return (
    <Panel title="证据" eyebrow="Evidence" action={<Badge tone="neutral" className="tabular-nums">{finalEvidenceSet.length || recallSet.length} hits</Badge>}>
      <div className="evidence-panel">
        {finalEvidenceSet.length ? (
          <EvidenceSection title="最终证据" description="进入报告和产物的主要来源。" items={finalEvidenceSet} />
        ) : null}
        {recallSet.length ? (
          <EvidenceSection title={finalEvidenceSet.length ? "召回候选" : "召回证据"} description="本次检索返回的候选片段。" items={recallSet} />
        ) : null}
        {!hasEvidence ? (
          <EmptyState title={selected ? "暂无证据" : "未选择会话"} message={selected ? "运行任务后会在这里展示来源、分数和引用信息。" : "选择或创建会话后可查看证据。"} />
        ) : null}
      </div>
    </Panel>
  );
}

function EvidenceSection({ title, description, items }: { title: string; description: string; items: EvidenceItem[] }) {
  return (
    <section className="evidence-panel__section" aria-label={title}>
      <div className="evidence-panel__heading">
        <div>
          <strong>{title}</strong>
          <span>{description}</span>
        </div>
        <Badge tone="neutral" className="tabular-nums">{items.length}</Badge>
      </div>
      <div className="evidence-panel__list">
        {items.map((evidence) => <EvidenceCard key={`${title}-${evidence.chunkId}-${evidence.rank}`} evidence={evidence} />)}
      </div>
    </section>
  );
}

function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
  return (
    <article className="evidence-card">
      <div className="evidence-card__header">
        <strong><span className="tabular-nums">#{evidence.rank}</span> {evidence.fileName}</strong>
        <Badge tone="neutral" className="tabular-nums">{evidence.score.toFixed(4)}</Badge>
      </div>
      <div className="evidence-card__source">
        <span className="id-text truncate-id" title={evidence.citationId}>{evidence.citationId}</span>
        {evidence.sectionTitle ? <span>{evidence.sectionTitle}</span> : null}
        <span className="tabular-nums">chunk {evidence.chunkNo}</span>
        <span>{evidence.retrievalStrategy}</span>
      </div>
      <p>{evidence.contentPreview}</p>
    </article>
  );
}
