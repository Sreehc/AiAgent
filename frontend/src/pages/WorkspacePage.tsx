import { FormEvent, useEffect, useMemo, useState } from "react";
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
  executionMode: "PLAN_EXECUTE" as AgentMode,
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
  const [error, setError] = useState<string | null>(null);

  const latestArtifact = useMemo<ArtifactItem | null>(() => {
    return sessionDetail?.artifacts[0] ?? null;
  }, [sessionDetail]);

  const latestPlanSteps = useMemo<PlanStepItem[]>(() => {
    return sessionDetail?.planSteps ?? [];
  }, [sessionDetail]);

  const latestToolInvocations = useMemo<ToolInvocationItem[]>(() => {
    return sessionDetail?.toolInvocations ?? [];
  }, [sessionDetail]);

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

  async function onCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) {
      return;
    }
    setCreatingSession(true);
    setError(null);
    try {
      const created = await apiRequest<SessionItem>(
        "/sessions",
        {
          method: "POST",
          body: JSON.stringify(sessionForm)
        },
        session.accessToken
      );
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
    setStreamLogs([]);

    const requestBody = {
      query: runForm.query,
      executionMode: runForm.executionMode,
      knowledgeBaseIds: parseKnowledgeBaseIds(runForm.knowledgeBaseIds)
    };

    try {
      await streamRequest(`/sessions/${selectedSessionId}/stream`, requestBody, session.accessToken, onStreamEvent);
      await loadSessions();
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
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
        {
          method: "POST",
          body: JSON.stringify({
            knowledgeBaseIds: parseKnowledgeBaseIds(runForm.knowledgeBaseIds)
          })
        },
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
        setSessionDetail((current) =>
          current
            ? {
                ...current,
                summary
              }
            : current
        );
      }
    }
  }

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Research Workspace</p>
          <h2>聊天研究工作台</h2>
        </div>
        <span className="badge">{runningTask ? "执行进行中" : "会话执行已接入"}</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>新建会话</h3>
            <form className="workspace-form" onSubmit={onCreateSession}>
              <label>
                标题
                <input
                  value={sessionForm.title}
                  onChange={(event) =>
                    setSessionForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="例如：新能源市场研究"
                />
              </label>
              <label>
                Agent 模式
                <select
                  value={sessionForm.agentMode}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      agentMode: event.target.value as AgentMode
                    }))
                  }
                >
                  <option value="REACT">REACT</option>
                  <option value="PLAN_EXECUTE">PLAN_EXECUTE</option>
                </select>
              </label>
              <button type="submit" disabled={creatingSession}>
                {creatingSession ? "创建中..." : "创建会话"}
              </button>
            </form>
          </div>

          <div className="workspace-sidebar__section">
            <div className="workspace-sidebar__heading">
              <h3>会话列表</h3>
              <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadSessions()}>
                刷新
              </button>
            </div>
            {loadingSessions ? <p className="muted">正在加载会话...</p> : null}
            <div className="session-list">
              {sessions.map((item) => (
                <button
                  key={item.sessionId}
                  type="button"
                  className={`session-card ${selectedSessionId === item.sessionId ? "session-card--active" : ""}`}
                  onClick={() => setSelectedSessionId(item.sessionId)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.agentMode}</span>
                  <small>
                    {item.status} · {formatDateTime(item.createdAt)}
                  </small>
                </button>
              ))}
              {!loadingSessions && sessions.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>还没有会话，先创建一个研究主题。</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">Execution</p>
                <h3>{sessionDetail?.session.title ?? "选择会话后开始研究"}</h3>
              </div>
              <span className="badge badge--soft">
                {sessionDetail?.session.status ?? "IDLE"}
              </span>
            </div>

            <form className="workspace-form" onSubmit={onRunTask}>
              <div className="workspace-kb-strip">
                <span className="muted">当前会话知识库</span>
                <div className="workspace-kb-chips">
                  {sessionDetail?.knowledgeBaseIds?.map((kbId) => (
                    <span key={kbId} className="badge badge--soft">
                      {kbId}
                    </span>
                  ))}
                  {sessionDetail && sessionDetail.knowledgeBaseIds.length === 0 ? (
                    <span className="muted">未绑定，允许降级到普通执行</span>
                  ) : null}
                </div>
              </div>
              <label>
                研究问题
                <textarea
                  value={runForm.query}
                  onChange={(event) =>
                    setRunForm((current) => ({ ...current, query: event.target.value }))
                  }
                  rows={4}
                  placeholder="输入本次研究任务"
                />
              </label>
              <div className="workspace-form__row">
                <label>
                  执行模式
                  <select
                    value={runForm.executionMode}
                    onChange={(event) =>
                      setRunForm((current) => ({
                        ...current,
                        executionMode: event.target.value as AgentMode
                      }))
                    }
                  >
                    <option value="REACT">REACT</option>
                    <option value="PLAN_EXECUTE">PLAN_EXECUTE</option>
                  </select>
                </label>
                <label>
                  知识库 IDs
                  <input
                    value={runForm.knowledgeBaseIds}
                    onChange={(event) =>
                      setRunForm((current) => ({
                        ...current,
                        knowledgeBaseIds: event.target.value
                      }))
                    }
                    placeholder="kb_001,kb_002"
                  />
                </label>
              </div>
              <div className="workspace-inline-actions">
                <button type="button" className="ghost-button ghost-button--inline" onClick={() => void loadKnowledgeBases()}>
                  刷新知识库
                </button>
                <button type="button" className="ghost-button ghost-button--inline" disabled={!selectedSessionId || bindingKnowledgeBases} onClick={() => void onBindKnowledgeBases()}>
                  {bindingKnowledgeBases ? "绑定中..." : "绑定到当前会话"}
                </button>
              </div>
              {knowledgeBases.length > 0 ? (
                <div className="workspace-empty-block">
                  <p>可用知识库：{knowledgeBases.map((item) => `${item.name}(${item.kbId})`).join("、")}</p>
                </div>
              ) : null}
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <button type="submit" disabled={!selectedSessionId || runningTask}>
                {runningTask ? "执行中..." : "发起研究"}
              </button>
            </form>
          </section>

          <section className="workspace-grid workspace-grid--three">
            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Timeline</p>
                  <h3>实时事件流</h3>
                </div>
                <span className="muted">{streamLogs.length} events</span>
              </div>
              <div className="event-list">
                {streamLogs.map((log) => (
                  <article key={log.id} className="event-card">
                    <div className="event-card__header">
                      <strong>{log.event}</strong>
                      <small>{formatDateTime(log.createdAt)}</small>
                    </div>
                    <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                  </article>
                ))}
                {streamLogs.length === 0 ? (
                  <div className="workspace-empty-block">
                    <p>执行开始后，这里会持续显示 SSE 事件。</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Result</p>
                  <h3>报告与执行步骤</h3>
                </div>
                <button
                  type="button"
                  className="ghost-button ghost-button--inline"
                  disabled={!selectedSessionId}
                  onClick={() => selectedSessionId && void loadSessionDetail(selectedSessionId)}
                >
                  恢复历史
                </button>
              </div>

              <div className="result-meta">
                <div>
                  <span className="muted">最近执行</span>
                  <strong>{sessionDetail?.runs[0]?.runId ?? "-"}</strong>
                </div>
                <div>
                  <span className="muted">模式</span>
                  <strong>{sessionDetail?.runs[0]?.executionMode ?? "-"}</strong>
                </div>
                <div>
                  <span className="muted">产物数</span>
                  <strong>{sessionDetail?.artifacts.length ?? 0}</strong>
                </div>
              </div>

              <div className="plan-list">
                {latestPlanSteps.map((step) => (
                  <article key={`${step.stepNo}-${step.title}`} className="plan-card">
                    <div className="plan-card__header">
                      <strong>
                        {step.stepNo}. {step.title}
                      </strong>
                      <span>{step.status}</span>
                    </div>
                    <p className="muted">{step.toolName ?? "未执行工具"}</p>
                    {step.toolOutput ? <p>{step.toolOutput}</p> : null}
                  </article>
                ))}
                {latestPlanSteps.length === 0 ? (
                  <div className="workspace-empty-block">
                    <p>执行完成后，这里会显示计划步骤和工具结果。</p>
                  </div>
                ) : null}
              </div>

              <div className="report-card">
                <div className="report-card__header">
                  <strong>{latestArtifact?.title ?? "尚未生成报告"}</strong>
                  {latestArtifact ? <span className="badge badge--soft">{latestArtifact.artifactType}</span> : null}
                </div>
                <pre>{sessionDetail?.summary ?? latestArtifact?.content ?? "暂无报告内容"}</pre>
              </div>
            </div>

            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Ledger</p>
                  <h3>工具调用账本</h3>
                </div>
                <span className="muted">{latestToolInvocations.length} calls</span>
              </div>
              <div className="event-list">
                {latestToolInvocations.map((toolInvocation) => (
                  <article key={toolInvocation.toolCallId} className="event-card">
                    <div className="event-card__header">
                      <strong>{toolInvocation.toolName}</strong>
                      <small>{toolInvocation.status}</small>
                    </div>
                    <p className="muted">
                      {toolInvocation.toolType} · {formatDateTime(toolInvocation.startedAt)}
                    </p>
                    <pre>{toolInvocation.responsePayload ?? toolInvocation.requestPayload}</pre>
                  </article>
                ))}
                {latestToolInvocations.length === 0 ? (
                  <div className="workspace-empty-block">
                    <p>执行接入 MCP 工具后，这里会显示工具调用账本。</p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function parseKnowledgeBaseIds(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
