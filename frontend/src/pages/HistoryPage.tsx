import { useEffect, useMemo, useState } from "react";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  apiRequest,
  ApiError,
  ArtifactItem,
  PlanStepItem,
  SessionDetailResponse,
  SessionItem,
  SessionListResponse,
  ToolInvocationItem
} from "../services/api";

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
    return sessions.filter((item) => {
      return item.title.toLowerCase().includes(normalized)
        || item.sessionId.toLowerCase().includes(normalized)
        || item.status.toLowerCase().includes(normalized)
        || item.agentMode.toLowerCase().includes(normalized);
    });
  }, [keyword, sessions]);

  const reportArtifact = useMemo<ArtifactItem | null>(() => {
    return sessionDetail?.artifacts.find((artifact) => artifact.artifactType === "REPORT") ?? null;
  }, [sessionDetail]);

  const nonReportArtifacts = useMemo<ArtifactItem[]>(() => {
    return sessionDetail?.artifacts.filter((artifact) => artifact.artifactType !== "REPORT") ?? [];
  }, [sessionDetail]);

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
      const detail = await apiRequest<SessionDetailResponse>(
        `/sessions/${sessionId}/replay`,
        {},
        session.accessToken
      );
      setSessionDetail(detail);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setReplaying(false);
    }
  }

  return (
    <section className="workspace">
      <header className="workspace__header">
        <div>
          <p className="eyebrow">Replay Workspace</p>
          <h2>历史会话页</h2>
        </div>
        <span className="badge">{filteredSessions.length} sessions</span>
      </header>

      <div className="workspace-layout">
        <aside className="workspace-sidebar workspace__panel">
          <div className="workspace-sidebar__section">
            <h3>会话筛选</h3>
            <div className="workspace-form">
              <label>
                关键词
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="标题 / ID / 状态 / 模式"
                />
              </label>
              <button type="button" onClick={() => void loadSessions()}>
                刷新列表
              </button>
            </div>
          </div>

          <div className="workspace-sidebar__section">
            <div className="workspace-sidebar__heading">
              <h3>历史会话</h3>
              <span className="muted">{loading ? "加载中..." : `${filteredSessions.length} 条`}</span>
            </div>
            <div className="session-list">
              {filteredSessions.map((item) => (
                <button
                  key={item.sessionId}
                  type="button"
                  className={`session-card ${selectedSessionId === item.sessionId ? "session-card--active" : ""}`}
                  onClick={() => setSelectedSessionId(item.sessionId)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.sessionId}</span>
                  <small>
                    {item.status} · {item.agentMode} · {formatDateTime(item.createdAt)}
                  </small>
                </button>
              ))}
              {!loading && filteredSessions.length === 0 ? (
                <div className="workspace-empty-block">
                  <p>当前筛选条件下没有历史会话。</p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="workspace-main">
          <section className="workspace__panel workspace-main__section">
            <div className="workspace-main__section-header">
              <div>
                <p className="eyebrow">Replay Detail</p>
                <h3>{sessionDetail?.session.title ?? "选择一个会话查看回放"}</h3>
              </div>
              <span className="badge badge--soft">
                {replaying ? "回放加载中" : sessionDetail?.session.status ?? "IDLE"}
              </span>
            </div>

            {error ? <p className="form-message form-message--error">{error}</p> : null}

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

            <div className="report-card">
              <div className="report-card__header">
                <strong>{reportArtifact?.title ?? "暂无报告产物"}</strong>
                {reportArtifact ? <span className="badge badge--soft">REPORT</span> : null}
              </div>
              <pre>{sessionDetail?.summary ?? reportArtifact?.content ?? "这里会显示总结结果与报告正文。"}</pre>
            </div>
          </section>

          <section className="workspace-grid workspace-grid--three">
            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Plan Timeline</p>
                  <h3>计划时间线</h3>
                </div>
                <span className="muted">{latestPlanSteps.length} steps</span>
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
                    <p className="muted">{step.toolName ?? "未调用工具"}</p>
                    {step.toolInput ? <p>输入：{step.toolInput}</p> : null}
                    {step.toolOutput ? <p>输出：{step.toolOutput}</p> : null}
                  </article>
                ))}
                {latestPlanSteps.length === 0 ? (
                  <div className="workspace-empty-block">
                    <p>该会话暂无计划步骤。</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Tool Ledger</p>
                  <h3>工具调用列表</h3>
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
                    <p>该会话暂无工具调用记录。</p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="workspace__panel workspace-main__section">
              <div className="workspace-main__section-header">
                <div>
                  <p className="eyebrow">Artifacts</p>
                  <h3>产物引用列表</h3>
                </div>
                <span className="muted">{nonReportArtifacts.length} refs</span>
              </div>
              <div className="plan-list">
                {nonReportArtifacts.map((artifact) => (
                  <article key={artifact.artifactId} className="plan-card">
                    <div className="plan-card__header">
                      <strong>{artifact.title}</strong>
                      <span>{artifact.artifactType}</span>
                    </div>
                    <p className="muted">{artifact.mimeType ?? "artifact"}</p>
                    {artifact.resultUrl ? (
                      <a href={artifact.resultUrl} target="_blank" rel="noreferrer">
                        打开产物
                      </a>
                    ) : (
                      <p>该产物无外部文件链接。</p>
                    )}
                  </article>
                ))}
                {nonReportArtifacts.length === 0 ? (
                  <div className="workspace-empty-block">
                    <p>该会话暂无图片或附件产物。</p>
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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false
  });
}
