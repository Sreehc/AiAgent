import { useEffect, useMemo, useState } from "react";
import { Alert, Button, EmptyState, Field, Input, Panel, StatusPill } from "../components/ui";
import { useAuthSession } from "../hooks/useAuthSession";
import { apiRequest, ApiError, ArtifactItem, PlanStepItem, SessionDetailResponse, SessionItem, SessionListResponse, ToolInvocationItem } from "../services/api";

export function HistoryPage() {
  const { session } = useAuthSession();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return sessions;
    }
    return sessions.filter((item) => item.title.toLowerCase().includes(normalized) || item.sessionId.toLowerCase().includes(normalized) || item.status.toLowerCase().includes(normalized) || item.agentMode.toLowerCase().includes(normalized));
  }, [keyword, sessions]);

  const reportArtifact = useMemo<ArtifactItem | null>(() => sessionDetail?.artifacts.find((artifact) => artifact.artifactType === "REPORT") ?? null, [sessionDetail]);
  const nonReportArtifacts = useMemo<ArtifactItem[]>(() => sessionDetail?.artifacts.filter((artifact) => artifact.artifactType !== "REPORT") ?? [], [sessionDetail]);
  const latestPlanSteps = useMemo<PlanStepItem[]>(() => sessionDetail?.planSteps ?? [], [sessionDetail]);
  const latestToolInvocations = useMemo<ToolInvocationItem[]>(() => sessionDetail?.toolInvocations ?? [], [sessionDetail]);

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void loadSessions();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!selectedSessionId || !session?.accessToken) {
      return;
    }
    void loadReplay(selectedSessionId);
  }, [selectedSessionId, session?.accessToken]);

  async function loadSessions() {
    if (!session?.accessToken) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<SessionListResponse>("/sessions?pageNo=1&pageSize=50", {}, session.accessToken);
      setSessions(result.items);
      setSelectedSessionId((current) => current ?? result.items[0]?.sessionId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReplay(sessionId: string) {
    if (!session?.accessToken) {
      return;
    }
    setReplaying(true);
    setError(null);
    try {
      const detail = await apiRequest<SessionDetailResponse>(`/sessions/${sessionId}/replay`, {}, session.accessToken);
      setSessionDetail(detail);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setReplaying(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Replay</p>
          <h1>历史回放</h1>
          <p>恢复会话的执行链路，包括计划步骤、工具调用、总结和产物引用。</p>
        </div>
        <span className="badge">{filteredSessions.length} sessions</span>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="content-grid">
        <aside className="stack">
          <Panel title="会话筛选" eyebrow="Filter" action={<Button type="button" variant="ghost" size="sm" onClick={() => void loadSessions()}>刷新</Button>}>
            <Field label="关键词"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="标题 / ID / 状态 / 模式" /></Field>
          </Panel>
          <Panel title="历史会话" eyebrow="Sessions" action={<span className="badge">{loading ? "加载中" : `${filteredSessions.length} 条`}</span>}>
            <div className="list">
              {filteredSessions.map((item) => (
                <button key={item.sessionId} type="button" className={`list-item ${selectedSessionId === item.sessionId ? "list-item--active" : ""}`} onClick={() => setSelectedSessionId(item.sessionId)}>
                  <strong>{item.title}</strong>
                  <span>{item.sessionId}</span>
                  <small>{item.agentMode} · {formatDateTime(item.createdAt)}</small>
                  <StatusPill status={item.status} />
                </button>
              ))}
              {!loading && filteredSessions.length === 0 ? <EmptyState message="当前筛选条件下没有历史会话。" /> : null}
            </div>
          </Panel>
        </aside>

        <main className="stack">
          <Panel title={sessionDetail?.session.title ?? "选择一个会话查看回放"} eyebrow="Replay Detail" action={<StatusPill status={replaying ? "RUNNING" : sessionDetail?.session.status ?? "IDLE"} />}>
            <div className="stack">
              <div className="meta-grid">
                <div className="meta-card"><span>最近执行</span><strong>{sessionDetail?.runs[0]?.runId ?? "-"}</strong></div>
                <div className="meta-card"><span>模式</span><strong>{sessionDetail?.runs[0]?.executionMode ?? "-"}</strong></div>
                <div className="meta-card"><span>产物数</span><strong>{sessionDetail?.artifacts.length ?? 0}</strong></div>
              </div>
              <div className="markdown-block">{sessionDetail?.summary ?? reportArtifact?.content ?? "这里会显示总结结果与报告正文。"}</div>
            </div>
          </Panel>

          <div className="content-grid content-grid--two">
            <Panel title="计划时间线" eyebrow="Plan" action={<span className="badge">{latestPlanSteps.length} steps</span>}>
              <div className="timeline">
                {latestPlanSteps.map((step) => (
                  <article key={`${step.stepNo}-${step.title}`} className="timeline-item">
                    <div className="timeline-item__header"><strong>{step.stepNo}. {step.title}</strong><StatusPill status={step.status} /></div>
                    <p className="muted">{step.toolName ?? "未调用工具"}</p>
                    {step.toolInput ? <pre className="json-block">{step.toolInput}</pre> : null}
                    {step.toolOutput ? <pre className="json-block">{step.toolOutput}</pre> : null}
                  </article>
                ))}
                {latestPlanSteps.length === 0 ? <EmptyState message="该会话暂无计划步骤。" /> : null}
              </div>
            </Panel>
            <Panel title="工具调用" eyebrow="Tools" action={<span className="badge">{latestToolInvocations.length} calls</span>}>
              <div className="timeline">
                {latestToolInvocations.map((toolInvocation) => (
                  <article key={toolInvocation.toolCallId} className="timeline-item">
                    <div className="timeline-item__header"><strong>{toolInvocation.toolName}</strong><StatusPill status={toolInvocation.status} /></div>
                    <p className="muted">{toolInvocation.toolType} · {formatDateTime(toolInvocation.startedAt)}</p>
                    <pre className="json-block">{toolInvocation.responsePayload ?? toolInvocation.requestPayload}</pre>
                  </article>
                ))}
                {latestToolInvocations.length === 0 ? <EmptyState message="该会话暂无工具调用记录。" /> : null}
              </div>
            </Panel>
          </div>

          <Panel title="产物引用" eyebrow="Artifacts" action={<span className="badge">{nonReportArtifacts.length} refs</span>}>
            <div className="artifact-list">
              {nonReportArtifacts.map((artifact) => (
                <article key={artifact.artifactId} className="list-item">
                  <div className="split"><strong>{artifact.title}</strong><span className="badge">{artifact.artifactType}</span></div>
                  <small>{artifact.mimeType ?? "artifact"}</small>
                  {artifact.resultUrl ? <a href={artifact.resultUrl} target="_blank" rel="noreferrer">打开产物</a> : <span className="muted">该产物无外部文件链接。</span>}
                </article>
              ))}
              {nonReportArtifacts.length === 0 ? <EmptyState message="该会话暂无图片或附件产物。" /> : null}
            </div>
          </Panel>
        </main>
      </div>
    </section>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}
