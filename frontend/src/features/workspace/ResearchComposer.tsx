import { FormEvent } from "react";
import { ArtifactItem, KnowledgeBaseItem } from "../../services/api";
import { AgentMode, StrategyMode } from "../../services/sessionsApi";
import { Alert, Button, EmptyState, Field, Panel, StatusPill, Tabs, Textarea } from "../../components/ui";

type ResearchComposerProps = {
  selected: boolean;
  sessionStatus: string;
  form: { query: string; executionMode: AgentMode; strategyMode: StrategyMode; knowledgeBaseIds: string; artifactIds: string };
  selectedArtifacts: ArtifactItem[];
  knowledgeBases: KnowledgeBaseItem[];
  running: boolean;
  paused: boolean;
  binding: boolean;
  onFormChange: (form: { query: string; executionMode: AgentMode; strategyMode: StrategyMode; knowledgeBaseIds: string; artifactIds: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onPause: () => void;
  onResume: () => void;
  onRemoveArtifact: (artifactId: string) => void;
  onBind: () => void;
  onRefreshKnowledge: () => void;
};

export function ResearchComposer({ selected, sessionStatus, form, selectedArtifacts, knowledgeBases, running, paused, binding, onFormChange, onSubmit, onCancel, onPause, onResume, onRemoveArtifact, onBind, onRefreshKnowledge }: ResearchComposerProps) {
  const selectedIds = parseKnowledgeBaseIds(form.knowledgeBaseIds);
  return (
    <Panel title="研究任务" eyebrow="Composer" action={<StatusPill status={sessionStatus} />}>
      {!selected ? <Alert tone="info">先创建或选择一个会话，再提交研究任务。</Alert> : null}
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="研究问题"><Textarea value={form.query} onChange={(event) => onFormChange({ ...form, query: event.target.value })} rows={5} placeholder="输入本次研究任务" required /></Field>
        <Tabs ariaLabel="策略选择" value={form.strategyMode} items={[{ id: "AUTO", label: "自动策略" }, { id: "MANUAL", label: "手动模式" }]} onChange={(strategyMode) => onFormChange({ ...form, strategyMode })} />
        <Tabs ariaLabel="执行模式" value={form.executionMode} items={[{ id: "REACT", label: "ReAct" }, { id: "PLAN_EXECUTE", label: "Plan Execute" }]} onChange={(executionMode) => onFormChange({ ...form, executionMode })} />
        <div className="stack">
          <div className="split"><strong>复用产物</strong><span className="badge badge--neutral">{selectedArtifacts.length} 个</span></div>
          <div className="artifact-list">
            {selectedArtifacts.map((artifact) => (
              <article key={artifact.artifactId} className="list-item">
                <div className="split"><strong>{artifact.title}</strong><span className="badge">{artifact.artifactType}</span></div>
                <small>{artifact.mimeType ?? "artifact"} · {artifact.artifactId}</small>
                <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveArtifact(artifact.artifactId)}>移除</Button>
              </article>
            ))}
            {selectedArtifacts.length === 0 ? <EmptyState message="可在历史回放或产物面板中选择产物作为上下文。" /> : null}
          </div>
        </div>
        <div className="kb-option-list" aria-label="绑定知识库">
          {knowledgeBases.map((item) => {
            const checked = selectedIds.includes(item.kbId);
            return (
              <label key={item.kbId} className={`kb-option ${checked ? "kb-option--selected" : ""}`}>
                <input type="checkbox" checked={checked} onChange={(event) => {
                  const next = new Set(selectedIds);
                  event.target.checked ? next.add(item.kbId) : next.delete(item.kbId);
                  onFormChange({ ...form, knowledgeBaseIds: Array.from(next).join(",") });
                }} />
                <span>{item.name}</span><small>{item.documentCount} 文档</small>
              </label>
            );
          })}
          {knowledgeBases.length === 0 ? <EmptyState message="暂无可用知识库，任务会按普通上下文执行。" /> : null}
        </div>
        <div className="cluster">
          <Button type="button" variant="secondary" onClick={onRefreshKnowledge}>刷新知识库</Button>
          <Button type="button" variant="secondary" loading={binding} disabled={!selected} onClick={onBind}>绑定到当前会话</Button>
          <Button type="button" variant="secondary" disabled={!running || paused} onClick={onPause}>暂停</Button>
          <Button type="button" variant="secondary" disabled={!running || !paused} onClick={onResume}>继续</Button>
          <Button type="button" variant="secondary" disabled={!running} onClick={onCancel}>取消运行</Button>
          <Button type="submit" variant="primary" loading={running && !paused} disabled={!selected || running}>运行研究</Button>
        </div>
      </form>
    </Panel>
  );
}

function parseKnowledgeBaseIds(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}
