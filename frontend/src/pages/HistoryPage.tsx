import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "../components/ui";
import { HistoryFilters } from "../features/history/HistoryFilters";
import { HistoryList } from "../features/history/HistoryList";
import { ReplayDetail } from "../features/history/ReplayDetail";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, ArtifactItem, SessionDetailResponse, SessionItem } from "../services/api";
import { sessionsApi } from "../services/sessionsApi";

export function HistoryPage() {
  const { session } = useAuthSession();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [replayFailed, setReplayFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return sessions.filter((item) => (!status || item.status === status) && (!normalized || item.title.toLowerCase().includes(normalized) || item.sessionId.toLowerCase().includes(normalized) || item.agentMode.toLowerCase().includes(normalized)));
  }, [keyword, sessions, status]);

  useEffect(() => {
    if (session?.accessToken) void loadSessions();
  }, [session?.accessToken]);

  useEffect(() => {
    if (selectedSessionId && session?.accessToken) void loadReplay(selectedSessionId);
  }, [selectedSessionId, session?.accessToken]);

  async function loadSessions() {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await sessionsApi.list(session.accessToken, 1, 50);
      setSessions(result.items);
      setSelectedSessionId((current) => current ?? result.items[0]?.sessionId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReplay(sessionId: string) {
    if (!session?.accessToken) return;
    setReplaying(true);
    setReplayFailed(false);
    setError(null);
    try {
      setDetail(await sessionsApi.replay(session.accessToken, sessionId));
    } catch (requestError) {
      setReplayFailed(true);
      setError((requestError as ApiError).message);
    } finally {
      setReplaying(false);
    }
  }

  function onUseArtifact(artifact: ArtifactItem) {
    const key = "aiagent.reuseArtifacts";
    let current: ArtifactItem[] = [];
    try {
      const raw = localStorage.getItem(key);
      current = raw ? JSON.parse(raw) as ArtifactItem[] : [];
    } catch {
      current = [];
    }
    const next = current.some((item) => item.artifactId === artifact.artifactId) ? current : [...current, artifact];
    localStorage.setItem(key, JSON.stringify(next));
    navigate("/workspace/chat");
  }

  return (
    <section className="page">
      <header className="page-header"><div><h1>历史回放</h1><p>审计研究任务的原始输入、执行步骤、工具调用和最终产物。</p></div><div className="page-header__meta"><span className="badge badge--neutral">{detail?.planSteps.length ?? 0} steps</span><span className="badge badge--neutral">{detail?.toolInvocations.length ?? 0} calls</span></div><span className="badge">{filtered.length} sessions</span></header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="content-grid">
        <aside className="stack"><HistoryFilters keyword={keyword} status={status} onKeywordChange={setKeyword} onStatusChange={setStatus} onRefresh={() => void loadSessions()} /><HistoryList items={filtered} selectedId={selectedSessionId} loading={loading} onSelect={setSelectedSessionId} /></aside>
        <main><ReplayDetail detail={detail} loading={replaying} failed={replayFailed} onRetry={() => selectedSessionId && void loadReplay(selectedSessionId)} onUseArtifact={onUseArtifact} /></main>
      </div>
    </section>
  );
}
