import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Button, EmptyState, Field, Input, Panel, Select, StatusPill, Textarea } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  apiRequest,
  ApiError,
  ArtifactItem,
  KnowledgeBaseItem,
  PlanStepItem,
  SessionDetailResponse,
  SessionItem,
  SessionListResponse,
  SessionStreamEvent,
  ToolInvocationItem,
  streamRequest
} from "../services/api";

type AgentMode = "REACT" | "PLAN_EXECUTE";

type StreamLog = {
  id: string;
  event: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

const DEFAULT_SESSION_FORM = {
  title: "新能源市场研究",
  agentMode: "REACT" as AgentMode
};

const DEFAULT_RUN_FORM = {
  query: "分析 2026 年储能行业竞争格局，并输出结构化报告",
  executionMode: "REACT" as AgentMode,
  knowledgeBaseIds: ""
};

export function WorkspacePage() {
  const { session } = useAuthSession();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [sessionForm, setSessionForm] = useState(DEFAULT_SESSION_FORM);
  const [runForm, setRunForm] = useState(DEFAULT_RUN_FORM);
  const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [creatingSession, setCreatingSession] = useState(false);
  const [runningTask, setRunningTask] = useState(false);
  const [bindingKnowledgeBases, setBindingKnowledgeBases] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [streamDisconnected, setStreamDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(null);

  const latestArtifact = useMemo<ArtifactItem | null>(() => {
    return sessionDetail?.artifacts.find((artifact) => artifact.artifactType === "REPORT") ?? null;
  }, [sessionDetail]);

  const visibleArtifacts = useMemo<ArtifactItem[]>(() => sessionDetail?.artifacts ?? [], [sessionDetail]);
  const latestPlanSteps = useMemo<PlanStepItem[]>(() => sessionDetail?.planSteps ?? [], [sessionDetail]);
  const latestToolInvocations = useMemo<ToolInvocationItem[]>(() => sessionDetail?.toolInvocations ?? [], [sessionDetail]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadSessions();
    void loadKnowledgeBases();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!sessionDetail) {
      return;
    }
    setRunForm((current) => ({
      ...current,
      executionMode: sessionDetail.session.agentMode,
      knowledgeBaseIds: sessionDetail.knowledgeBaseIds.join(",")
    }));
  }, [sessionDetail?.session.sessionId, sessionDetail?.knowledgeBaseIds]);

  useEffect(() => {
    if (!session?.accessToken || !selectedSessionId) {
      return;
    }
    void loadSessionDetail(selectedSessionId);
  }, [selectedSessionId, session?.accessToken]);

  async function loadSessions() {
    if (!session?.accessToken) {
      return;
    }
    setLoadingSessions(true);
    try {
      const result = await apiRequest<SessionListResponse>("/sessions?pageNo=1&pageSize=20", {}, session.accessToken);
      setSessions(result.items);
      setSelectedSessionId((current) => current ?? result.items[0]?.sessionId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadSessionDetail(sessionId: string) {
    if (!session?.accessToken) {
      return;
    }
    try {
      const detail = await apiRequest<SessionDetailResponse>(`/sessions/${sessionId}`, {}, session.accessToken);
      setSessionDetail(detail);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function loadKnowledgeBases() {
    if (!session?.accessToken) {
      return;
    }
    try {
      const result = await apiRequest<KnowledgeBaseItem[]>("/knowledge-bases", {}, session.accessToken);
      setKnowledgeBases(result);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onDeleteSession() {
    if (!session?.accessToken || !sessionToDelete) {
      return;
    }
    setDeletingSession(true);
    setError(null);
    try {
      await apiRequest<void>(`/sessions/${sessionToDelete.sessionId}`, { method: "DELETE" }, session.accessToken);
      if (selectedSessionId === sessionToDelete.sessionId) {
        setSelectedSessionId(null);
        setSessionDetail(null);
      }
      setSessionToDelete(null);
      await loadSessions();
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setDeletingSession(false);
    }
  }

  async function onCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setCreatingSession(true);
    setError(null);
    try {
      const created = await apiRequest<SessionItem>("/sessions", { method: "POST", body: JSON.stringify(sessionForm) }, session.accessToken);
      await loadSessions();
      setSelectedSessionId(created.sessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setCreatingSession(false);
    }
  }

  async function onRunTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedSessionId) {
      return;
    }
    setRunningTask(true);
    setError(null);
    setStreamDisconnected(false);
    setStreamLogs([]);

    try {
      await streamRequest(
        `/sessions/${selectedSessionId}/stream`,
        {
          query: runForm.query,
          executionMode: runForm.executionMode,
          knowledgeBaseIds: parseKnowledgeBaseIds(runForm.knowledgeBaseIds)
        },
        session.accessToken,
        onStreamEvent
      );
      await loadSessions();
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setStreamDisconnected(true);
      setError((requestError as ApiError).message || "实时连接已中断，可通过历史回放恢复结果。");
      await loadSessionDetail(selectedSessionId);
    } finally {
      setRunningTask(false);
    }
  }

  async function onBindKnowledgeBases() {
    if (!session?.accessToken || !selectedSessionId) {
      return;
    }
    setBindingKnowledgeBases(true);
    setError(null);
    try {
      await apiRequest<{ sessionId: string; knowledgeBaseIds: string[] }>(
        `/sessions/${selectedSessionId}/knowledge-bases/bind`,
        { method: "POST", body: JSON.stringify({ knowledgeBaseIds: parseKnowledgeBaseIds(runForm.knowledgeBaseIds) }) },
        session.accessToken
      );
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setBindingKnowledgeBases(false);
    }
  }

  function onStreamEvent(event: SessionStreamEvent) {
    const nextLog: StreamLog = {
      id: `${event.event}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      event: event.event,
      createdAt: new Date().toISOString(),
      payload: event.data
    };
    setStreamLogs((current) => [nextLog, ...current].slice(0, 30));
    if (event.event === "summary.completed") {
      const summary = typeof event.data.summary === "string" ? event.data.summary : null;
      if (summary) {
        setSessionDetail((current) => current ? { ...current, summary } : current);
      }
    }
  }

  const selectedKbIds = parseKnowledgeBaseIds(runForm.knowledgeBaseIds);

  return (
    <section className="page">
      <header className="page-header">
        <h1>研究工作台</h1>
        <div className="page-header__meta">
          <span className="badge badge--neutral">{sessions.length} 个会话</span>
          <span className="badge badge--neutral">{selectedKbIds.length} 个知识库</span>
        </div>
        <StatusPill status={runningTask ? "RUNNING" : sessionDetail?.session.status ?? "IDLE"} />
      </header>

      {error ? <Alert tone="error">{error}</Alert> : null}
      {streamDisconnected ? <Alert tone="info">实时连接已中断，可通过恢复历史重新加载最新执行结果。</Alert> : null}

      <div className="workspace-grid">
        <aside className="stack">
          <Panel title="新建会话" eyebrow="Session">
            <form className="form-grid" onSubmit={onCreateSession}>
              <Field label="标题">
                <Input value={sessionForm.title} onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))} placeholder="例如：新能源市场研究" />
              </Field>
              <Field label="Agent 模式">
                <Select value={sessionForm.agentMode} onChange={(event) => setSessionForm((current) => ({ ...current, agentMode: event.target.value as AgentMode }))}>
                  <option value="REACT">ReAct</option>
                  <option value="PLAN_EXECUTE">Plan Execute</option>
                </Select>
              </Field>
              <Button type="submit" variant="primary" loading={creatingSession} fullWidth>创建会话</Button>
            </form>
          </Panel>

          <Panel
            title="会话列表"
            eyebrow="Recent"
            action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadSessions()}>刷新</Button>}
          >
            <div className="list">
              {loadingSessions ? <p className="muted">正在加载会话...</p> : null}
              {sessions.map((item) => (
                <div key={item.sessionId} className={`list-item ${selectedSessionId === item.sessionId ? "list-item--active" : ""}`}>
                  <button type="button" className="list-item" onClick={() => setSelectedSessionId(item.sessionId)}>
                    <strong>{item.title}</strong>
                    <span>{item.agentMode === "REACT" ? "ReAct" : "Plan Execute"}</span>
                    <small>{formatDateTime(item.createdAt)}</small>
                  </button>
                  <div className="split">
                    <StatusPill status={item.status} />
                    <Button type="button" variant="danger" size="sm" onClick={() => setSessionToDelete(item)}>删除</Button>
                  </div>
                </div>
              ))}
              {!loadingSessions && sessions.length === 0 ? <EmptyState message="还没有会话，先创建一个研究主题。" /> : null}
            </div>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title={sessionDetail?.session.title ?? "选择会话后开始研究"} eyebrow="Composer" action={<StatusPill status={sessionDetail?.session.status ?? "IDLE"} />}>
            <form className="form-grid" onSubmit={onRunTask}>
              <Field label="研究问题">
                <Textarea value={runForm.query} onChange={(event) => setRunForm((current) => ({ ...current, query: event.target.value }))} rows={5} placeholder="输入本次研究任务" />
              </Field>
              <div className="segmented" aria-label="执行模式">
                {(["REACT", "PLAN_EXECUTE"] as AgentMode[]).map((mode) => (
                  <button key={mode} type="button" className={runForm.executionMode === mode ? "active" : ""} onClick={() => setRunForm((current) => ({ ...current, executionMode: mode }))}>
                    {mode === "REACT" ? "ReAct" : "Plan Execute"}
                  </button>
                ))}
              </div>

              <div className="kb-option-list">
                {knowledgeBases.map((item) => {
                  const selected = selectedKbIds.includes(item.kbId);
                  return (
                    <label key={item.kbId} className={`kb-option ${selected ? "kb-option--selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(event) => {
                          const next = new Set(parseKnowledgeBaseIds(runForm.knowledgeBaseIds));
                          if (event.target.checked) {
                            next.add(item.kbId);
                          } else {
                            next.delete(item.kbId);
                          }
                          setRunForm((current) => ({ ...current, knowledgeBaseIds: Array.from(next).join(",") }));
                        }}
                      />
                      <span>{item.name}</span>
                      <small>{item.documentCount} 文档</small>
                    </label>
                  );
                })}
                {knowledgeBases.length === 0 ? <EmptyState message="暂无可用知识库，任务会按普通上下文执行。" /> : null}
              </div>

              <div className="cluster">
                <Button type="button" variant="secondary" onClick={() => void loadKnowledgeBases()}>刷新知识库</Button>
                <Button type="button" variant="secondary" loading={bindingKnowledgeBases} disabled={!selectedSessionId} onClick={() => void onBindKnowledgeBases()}>绑定到当前会话</Button>
                <Button type="submit" variant="primary" loading={runningTask} disabled={!selectedSessionId}>运行研究</Button>
              </div>
            </form>
          </Panel>

          <Panel title="实时事件流" eyebrow="Stream" action={<span className="badge">{streamLogs.length} events</span>}>
            <div className="timeline">
              {streamLogs.map((log) => (
                <article key={log.id} className="timeline-item">
                  <div className="timeline-item__header">
                    <strong>{log.event}</strong>
                    <small>{formatDateTime(log.createdAt)}</small>
                  </div>
                  <pre className="json-block">{JSON.stringify(log.payload, null, 2)}</pre>
                </article>
              ))}
              {streamLogs.length === 0 ? <EmptyState message="执行开始后，这里会显示 SSE 事件。" /> : null}
            </div>
          </Panel>

          <Panel title="计划步骤" eyebrow="Plan">
            <div className="timeline">
              {latestPlanSteps.map((step) => (
                <PlanStepCard key={`${step.stepNo}-${step.title}`} step={step} />
              ))}
              {latestPlanSteps.length === 0 ? <EmptyState message="执行完成后，这里会显示计划步骤和工具结果。" /> : null}
            </div>
          </Panel>
        </main>

        <aside className="stack workspace-grid__results">
          <Panel
            title="结果与产物"
            eyebrow="Artifacts"
            action={<Button type="button" variant="ghost" size="sm" disabled={!selectedSessionId} onClick={() => selectedSessionId && void loadSessionDetail(selectedSessionId)}>恢复历史</Button>}
          >
            <div className="stack">
              <div className="meta-grid">
                <div className="meta-card"><span>最近执行</span><strong>{sessionDetail?.runs[0]?.runId ?? "-"}</strong></div>
                <div className="meta-card"><span>模式</span><strong>{sessionDetail?.runs[0]?.executionMode ?? "-"}</strong></div>
                <div className="meta-card"><span>产物数</span><strong>{sessionDetail?.artifacts.length ?? 0}</strong></div>
              </div>
              <div className="markdown-block">{sessionDetail?.summary ?? latestArtifact?.content ?? "暂无报告内容。"}</div>
              <div className="artifact-list">
                {visibleArtifacts.map((artifact) => (
                  <article key={artifact.artifactId} className="list-item">
                    <div className="split">
                      <strong>{artifact.title}</strong>
                      <span className="badge">{artifact.artifactType}</span>
                    </div>
                    <small>{artifact.mimeType ?? "artifact"}</small>
                    {artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : null}
                  </article>
                ))}
                {visibleArtifacts.length === 0 ? <EmptyState message="任务完成后，报告、图片或附件会显示在这里。" /> : null}
              </div>
            </div>
          </Panel>

          <Panel title="工具调用账本" eyebrow="Tools" action={<span className="badge">{latestToolInvocations.length} calls</span>}>
            <div className="timeline">
              {latestToolInvocations.map((toolInvocation) => (
                <ToolInvocationCard key={toolInvocation.toolCallId} toolInvocation={toolInvocation} />
              ))}
              {latestToolInvocations.length === 0 ? <EmptyState message="执行接入工具后，这里会显示调用请求和响应。" /> : null}
            </div>
          </Panel>
        </aside>
      </div>

      <ConfirmDialog
        isOpen={sessionToDelete !== null}
        title="确认删除会话"
        message={<>确定要删除会话「<strong>{sessionToDelete?.title}</strong>」吗？此操作不可恢复。</>}
        confirmText={deletingSession ? "删除中" : "删除会话"}
        cancelText="取消"
        onConfirm={onDeleteSession}
        onCancel={() => setSessionToDelete(null)}
        danger
      />
    </section>
  );
}

function PlanStepCard({ step }: { step: PlanStepItem }) {
  return (
    <article className="timeline-item">
      <div className="timeline-item__header">
        <strong>{step.stepNo}. {step.title}</strong>
        <StatusPill status={step.status} />
      </div>
      <p className="muted">{step.toolName ?? "未调用工具"}</p>
      {step.toolInput ? <pre className="json-block">{step.toolInput}</pre> : null}
      {step.toolOutput ? <pre className="json-block">{step.toolOutput}</pre> : null}
    </article>
  );
}

function ToolInvocationCard({ toolInvocation }: { toolInvocation: ToolInvocationItem }) {
  return (
    <article className="timeline-item">
      <div className="timeline-item__header">
        <strong>{toolInvocation.toolName}</strong>
        <StatusPill status={toolInvocation.status} />
      </div>
      <p className="muted">{toolInvocation.toolType} · {formatDateTime(toolInvocation.startedAt)}</p>
      <pre className="json-block">{toolInvocation.responsePayload ?? toolInvocation.requestPayload}</pre>
    </article>
  );
}

function parseKnowledgeBaseIds(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
