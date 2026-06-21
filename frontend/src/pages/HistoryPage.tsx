import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Badge } from "../components/ui";
import { HistoryFilters } from "../features/history/HistoryFilters";
import { HistoryList } from "../features/history/HistoryList";
import { ReplayDetail } from "../features/history/ReplayDetail";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, ArtifactItem, SessionDetailResponse, SessionItem } from "../services/api";
import { sessionsApi } from "../services/sessionsApi";

export function HistoryPage() {
  const { session } = useAuthSession();
  const navigate = useNavigate();
  const replayDetailRef = useRef<HTMLElement | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetailResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [replayFailed, setReplayFailed] = useState(false);
  const [reusingArtifactId, setReusingArtifactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return sessions.filter((item) => (!status || item.status === status) && (!normalized || item.title.toLowerCase().includes(normalized) || item.sessionId.toLowerCase().includes(normalized) || item.agentMode.toLowerCase().includes(normalized)));
  }, [keyword, sessions, status]);

  const replayStats = useMemo(() => ({
    steps: detail?.planSteps.length ?? 0,
    calls: detail?.toolInvocations.length ?? 0,
    artifacts: detail?.artifacts.length ?? 0,
    runs: detail?.runs.length ?? 0
  }), [detail]);

  useEffect(() => {
    if (session?.accessToken) void loadSessions();
  }, [session?.accessToken]);

  useEffect(() => {
    if (selectedSessionId && session?.accessToken) void loadReplay(selectedSessionId);
  }, [selectedSessionId, session?.accessToken]);

  useEffect(() => {
    if (!selectedSessionId || typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    window.requestAnimationFrame(() => {
      replayDetailRef.current?.scrollIntoView({ block: "start" });
    });
  }, [selectedSessionId]);

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
    setReusingArtifactId(artifact.artifactId);
    setError(null);
    let current: ArtifactItem[] = [];
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) as unknown : [];
      current = Array.isArray(parsed) ? parsed as ArtifactItem[] : [];
    } catch {
      current = [];
    }
    const next = current.some((item) => item.artifactId === artifact.artifactId) ? current : [...current, artifact];
    try {
      localStorage.setItem(key, JSON.stringify(next));
      navigate("/workspace/chat");
    } catch {
      setError("无法保存复用产物，请检查浏览器存储权限后重试。");
      setReusingArtifactId(null);
    }
  }

  return (
    <section className="page page--history">
      <header className="page-header">
        <div>
          <h1>历史回放</h1>
          <p>审计研究任务的原始输入、执行步骤、工具调用和最终产物。</p>
        </div>
        <div className="page-header__meta">
          <Badge tone="neutral" className="tabular-nums">{filtered.length}/{sessions.length} sessions</Badge>
          <Badge tone="neutral" className="tabular-nums">{replayStats.steps} steps</Badge>
          <Badge tone="neutral" className="tabular-nums">{replayStats.calls} calls</Badge>
          <Badge tone="neutral" className="tabular-nums">{replayStats.artifacts} artifacts</Badge>
        </div>
        <Badge className="tabular-nums">{replayStats.runs} runs</Badge>
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="history-replay-layout">
        <aside className="history-replay-layout__rail" aria-label="历史会话">
          <HistoryFilters keyword={keyword} status={status} loading={loading} onKeywordChange={setKeyword} onStatusChange={setStatus} onRefresh={() => void loadSessions()} />
          <HistoryList items={filtered} selectedId={selectedSessionId} loading={loading} onSelect={setSelectedSessionId} />
        </aside>
        <main ref={replayDetailRef} className="history-replay-layout__main" aria-label="历史回放详情">
          <ReplayDetail detail={detail} loading={replaying} failed={replayFailed} reusingArtifactId={reusingArtifactId} onRetry={() => selectedSessionId && void loadReplay(selectedSessionId)} onUseArtifact={onUseArtifact} />
        </main>
      </div>
    </section>
  );
}
