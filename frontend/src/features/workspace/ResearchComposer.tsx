import { FormEvent } from "react";
import { Pause, Play, Square } from "lucide-react";
import { ArtifactItem, KnowledgeBaseItem } from "../../services/api";
import { AgentMode, StrategyMode } from "../../services/sessionsApi";
import { Alert, Badge, Button, EmptyState, Field, Panel, StatusPill, Tabs, Textarea } from "../../components/ui";

type RunControlStatus = "IDLE" | "PENDING" | "RUNNING" | "PAUSED" | "CANCEL_REQUESTED" | "CANCELLED" | "COMPLETED" | "FAILED" | "TIMED_OUT" | "UNKNOWN" | string;

const RUN_STATUS_COPY: Record<string, { title: string; description: string }> = {
  IDLE: { title: "准备运行", description: "确认研究问题、执行模式和知识库后即可启动任务。" },
  PENDING: { title: "等待调度", description: "任务已提交，正在等待执行器接手；可暂停或取消。" },
  RUNNING: { title: "正在研究", description: "Agent feed 会持续追加计划、工具调用和产物事件。" },
  PAUSED: { title: "运行已暂停", description: "当前进度已保留，可继续执行或取消本次运行。" },
  CANCEL_REQUESTED: { title: "正在取消", description: "取消请求已发送，等待后端将运行状态收敛。" },
  CANCELLED: { title: "已取消", description: "本次运行已停止，可调整输入后重新发起研究。" },
  COMPLETED: { title: "研究完成", description: "报告、证据和产物已进入右侧 Inspector，可复用或回放。" },
  FAILED: { title: "研究失败", description: "已保留现有 feed 事件，可查看错误详情或重新运行。" },
  TIMED_OUT: { title: "运行超时", description: "已保留现有 feed 事件，可从历史恢复或重新运行。" },
  UNKNOWN: { title: "状态未知", description: "当前会话状态未被识别，请刷新详情后再操作。" }
};

type ResearchComposerProps = {
  selected: boolean;
  sessionStatus: string;
  form: { query: string; executionMode: AgentMode; strategyMode: StrategyMode; knowledgeBaseIds: string; artifactIds: string };
  selectedArtifacts: ArtifactItem[];
  knowledgeBases: KnowledgeBaseItem[];
  running: boolean;
  canPause: boolean;
  canResume: boolean;
  canCancel: boolean;
  pausing?: boolean;
  resuming?: boolean;
  cancelling?: boolean;
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

export function ResearchComposer({ selected, sessionStatus, form, selectedArtifacts, knowledgeBases, running, canPause, canResume, canCancel, pausing = false, resuming = false, cancelling = false, binding, onFormChange, onSubmit, onCancel, onPause, onResume, onRemoveArtifact, onBind, onRefreshKnowledge }: ResearchComposerProps) {
  const selectedIds = parseKnowledgeBaseIds(form.knowledgeBaseIds);
  const normalizedRunStatus = normalizeRunStatus(sessionStatus);
  const statusCopy = RUN_STATUS_COPY[normalizedRunStatus] ?? RUN_STATUS_COPY.UNKNOWN;
  const submitLoading = running && normalizedRunStatus !== "PAUSED" && normalizedRunStatus !== "CANCEL_REQUESTED";

  return (
    <Panel title="研究任务" eyebrow="Composer" action={<StatusPill status={sessionStatus} />}>
      {!selected ? <Alert tone="info">先创建或选择一个会话，再提交研究任务。</Alert> : null}
      <div className={`research-run-state research-run-state--${toStateClass(normalizedRunStatus)}`} data-run-status={normalizedRunStatus}>
        <StatusPill status={normalizedRunStatus} />
        <div>
          <strong>{statusCopy.title}</strong>
          <p>{statusCopy.description}</p>
        </div>
      </div>
      <form className="form-grid" onSubmit={onSubmit}>
        <Field label="研究问题"><Textarea value={form.query} onChange={(event) => onFormChange({ ...form, query: event.target.value })} rows={5} placeholder="输入本次研究任务" required /></Field>
        <Tabs ariaLabel="策略选择" value={form.strategyMode} items={[{ id: "AUTO", label: "自动策略" }, { id: "MANUAL", label: "手动模式" }]} onChange={(strategyMode) => onFormChange({ ...form, strategyMode })} />
        <Tabs ariaLabel="执行模式" value={form.executionMode} items={[{ id: "REACT", label: "ReAct" }, { id: "PLAN_EXECUTE", label: "Plan Execute" }]} onChange={(executionMode) => onFormChange({ ...form, executionMode })} />
        <div className="stack">
          <div className="split"><strong>复用产物</strong><Badge tone="neutral" className="tabular-nums">{selectedArtifacts.length} 个</Badge></div>
          <div className="artifact-list">
            {selectedArtifacts.map((artifact) => (
              <article key={artifact.artifactId} className="list-item">
                <div className="split"><strong>{artifact.title}</strong><Badge>{artifact.artifactType}</Badge></div>
                <small className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span>{artifact.mimeType ?? "artifact"}</span>
                  <span aria-hidden="true">·</span>
                  <span className="id-text truncate-id" title={artifact.artifactId}>{artifact.artifactId}</span>
                </small>
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
          <Button type="button" variant="secondary" aria-label="暂停当前运行" loading={pausing} disabled={!canPause} onClick={onPause}><Pause size={15} aria-hidden="true" />暂停</Button>
          <Button type="button" variant="secondary" aria-label="继续当前运行" loading={resuming} disabled={!canResume} onClick={onResume}><Play size={15} aria-hidden="true" />继续</Button>
          <Button type="button" variant="secondary" aria-label="取消当前运行" loading={cancelling} disabled={!canCancel} onClick={onCancel}><Square size={15} aria-hidden="true" />{cancelling ? "取消中" : "取消运行"}</Button>
          <Button type="submit" variant="primary" loading={submitLoading} disabled={!selected || running}>运行研究</Button>
        </div>
      </form>
    </Panel>
  );
}

function normalizeRunStatus(status: string): RunControlStatus {
  return (status.trim() || "UNKNOWN").toUpperCase();
}

function toStateClass(status: RunControlStatus) {
  return status.toLowerCase().replaceAll("_", "-");
}

function parseKnowledgeBaseIds(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}
