import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Alert, Badge, Button, StatusPill } from "../components/ui";
import { ExecutionTimeline } from "../features/workspace/ExecutionTimeline";
import { ResearchComposer } from "../features/workspace/ResearchComposer";
import { SessionList } from "../features/workspace/SessionList";
import { WorkspaceInspector } from "../features/workspace/WorkspaceInspector";
import { buildExecutionTimeline, LiveStreamItem, normalizeStreamEvent } from "../features/workspace/workspaceViewModel";
import { useAuthSession } from "../hooks/useAuthSession";
import { ApiError, ArtifactItem, KnowledgeBaseItem, SessionDetailResponse, SessionItem, SessionStreamEvent } from "../services/api";
import { knowledgeApi } from "../services/knowledgeApi";
import { artifactsApi } from "../services/artifactsApi";
import { AgentMode, StrategyMode, sessionsApi } from "../services/sessionsApi";

const DEFAULT_SESSION_FORM = { title: "新能源市场研究", agentMode: "REACT" as AgentMode };
const REUSE_ARTIFACTS_STORAGE_KEY = "aiagent.reuseArtifacts";
type RunFormState = { query: string; executionMode: AgentMode; strategyMode: StrategyMode; knowledgeBaseIds: string; artifactIds: string };
type RunControlAction = "pause" | "resume" | "cancel" | null;
const DEFAULT_RUN_FORM: RunFormState = { query: "分析 2026 年储能行业竞争格局，并输出结构化报告", executionMode: "REACT", strategyMode: "AUTO", knowledgeBaseIds: "", artifactIds: "" };

export function WorkspacePage() {
  const { session } = useAuthSession();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [sessionForm, setSessionForm] = useState(DEFAULT_SESSION_FORM);
  const [runForm, setRunForm] = useState(DEFAULT_RUN_FORM);
  const [selectedArtifacts, setSelectedArtifacts] = useState<ArtifactItem[]>([]);
  const [memoryContent, setMemoryContent] = useState("");
  const [liveEvents, setLiveEvents] = useState<LiveStreamItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [runningTask, setRunningTask] = useState(false);
  const [bindingKnowledgeBases, setBindingKnowledgeBases] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [streamDisconnected, setStreamDisconnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetailError, setSessionDetailError] = useState<string | null>(null);
  const [controlRunAction, setControlRunAction] = useState<RunControlAction>(null);
  const [deletingSession, setDeletingSession] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<SessionItem | null>(null);

  const timeline = useMemo(() => buildExecutionTimeline(sessionDetail, liveEvents), [liveEvents, sessionDetail]);
  const activeRun = useMemo(
    () => sessionDetail?.runs.find((run) => ["RUNNING", "PENDING", "PAUSED", "CANCEL_REQUESTED"].includes(run.status)) ?? null,
    [sessionDetail?.runs]
  );
  const activeRunStatus = activeRun?.status ?? null;
  const displayRunStatus = activeRunStatus ?? (runningTask ? "RUNNING" : sessionDetail?.session.status ?? "IDLE");
  const runLifecycleActive = runningTask || activeRun !== null;
  const canPauseRun = isPausableRunStatus(activeRunStatus) && controlRunAction === null;
  const canResumeRun = activeRunStatus === "PAUSED" && controlRunAction === null;
  const canCancelRun = isCancelableRunStatus(activeRunStatus) && controlRunAction === null;

  useEffect(() => {
    if (!session?.accessToken) return;
    void loadSessions();
    void loadKnowledgeBases();
    loadQueuedArtifacts();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !selectedSessionId) {
      setSessionDetail(null);
      setMemoryContent("");
      setLoadingSessionDetail(false);
      setSessionDetailError(null);
      return;
    }
    void loadSessionDetail(selectedSessionId);
    void loadMemory(selectedSessionId);
  }, [selectedSessionId, session?.accessToken]);

  useEffect(() => {
    if (!sessionDetail) return;
    setRunForm((current) => ({ ...current, executionMode: sessionDetail.session.agentMode, knowledgeBaseIds: sessionDetail.knowledgeBaseIds.join(",") }));
  }, [sessionDetail?.session.sessionId, sessionDetail?.knowledgeBaseIds]);

  async function loadSessions() {
    if (!session?.accessToken) return;
    setLoadingSessions(true);
    try {
      const result = await sessionsApi.list(session.accessToken, 1, 20);
      setSessions(result.items);
      setSelectedSessionId((current) => current ?? result.items[0]?.sessionId ?? null);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadSessionDetail(sessionId: string) {
    if (!session?.accessToken) return;
    setLoadingSessionDetail(true);
    setSessionDetailError(null);
    try {
      setSessionDetail(await sessionsApi.get(session.accessToken, sessionId));
    } catch (requestError) {
      const message = (requestError as ApiError).message;
      setError(message);
      setSessionDetailError(message);
    } finally {
      setLoadingSessionDetail(false);
    }
  }

  async function loadMemory(sessionId: string) {
    if (!session?.accessToken) return;
    try {
      const result = await sessionsApi.getMemory(session.accessToken, sessionId);
      setMemoryContent(result.content);
    } catch (requestError) {
      const message = (requestError as ApiError).message;
      setError(message);
      setSessionDetailError(message);
    }
  }

  async function loadKnowledgeBases() {
    if (!session?.accessToken) return;
    try {
      setKnowledgeBases(await knowledgeApi.list(session.accessToken));
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  async function onCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;
    setCreatingSession(true);
    setError(null);
    try {
      const created = await sessionsApi.create(session.accessToken, sessionForm);
      await loadSessions();
      setSelectedSessionId(created.sessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setCreatingSession(false);
    }
  }

  async function onDeleteSession() {
    if (!session?.accessToken || !sessionToDelete) return;
    setDeletingSession(true);
    setError(null);
    try {
      await sessionsApi.remove(session.accessToken, sessionToDelete.sessionId);
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

  async function onRunTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedSessionId) return;
    setRunningTask(true);
    setError(null);
    setStreamDisconnected(false);
    setControlRunAction(null);
    setLiveEvents([]);
    try {
      await sessionsApi.streamRun(session.accessToken, selectedSessionId, { query: runForm.query, executionMode: runForm.executionMode, strategyMode: runForm.strategyMode, knowledgeBaseIds: parseIds(runForm.knowledgeBaseIds), artifactIds: selectedArtifacts.map((artifact) => artifact.artifactId) }, onStreamEvent);
      await Promise.all([loadSessions(), loadSessionDetail(selectedSessionId)]);
    } catch (requestError) {
      setStreamDisconnected(true);
      setError((requestError as ApiError).message || "实时连接已中断，可通过历史回放恢复结果。");
      await loadSessionDetail(selectedSessionId);
    } finally {
      setRunningTask(false);
    }
  }

  async function onCancelRun() {
    if (!session?.accessToken || !selectedSessionId) return;
    const runId = activeRun?.runId;
    if (!runId || !canCancelRun) return;
    setControlRunAction("cancel");
    setError(null);
    try {
      await sessionsApi.cancelRun(session.accessToken, selectedSessionId, runId, "User cancelled from workspace");
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setControlRunAction(null);
    }
  }

  async function onPauseRun() {
    if (!session?.accessToken || !selectedSessionId || !activeRun || !canPauseRun) return;
    setControlRunAction("pause");
    setError(null);
    try {
      await sessionsApi.pauseRun(session.accessToken, selectedSessionId, activeRun.runId, "User paused from workspace");
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setControlRunAction(null);
    }
  }

  async function onResumeRun() {
    if (!session?.accessToken || !selectedSessionId || !activeRun || !canResumeRun) return;
    setControlRunAction("resume");
    setError(null);
    try {
      await sessionsApi.resumeRun(session.accessToken, selectedSessionId, activeRun.runId);
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setControlRunAction(null);
    }
  }

  async function onBindKnowledgeBases() {
    if (!session?.accessToken || !selectedSessionId) return;
    setBindingKnowledgeBases(true);
    setError(null);
    try {
      await sessionsApi.bindKnowledgeBases(session.accessToken, selectedSessionId, parseIds(runForm.knowledgeBaseIds));
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setBindingKnowledgeBases(false);
    }
  }

  async function onUploadArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedSessionId) return;
    const formData = new FormData(event.currentTarget);
    if (!formData.get("file")) return;
    setError(null);
    try {
      const artifact = await artifactsApi.upload(session.accessToken, formData, selectedSessionId);
      onUseArtifact(artifact);
      event.currentTarget.reset();
      await loadSessionDetail(selectedSessionId);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    }
  }

  function onUseArtifact(artifact: ArtifactItem) {
    setSelectedArtifacts((current) => current.some((item) => item.artifactId === artifact.artifactId) ? current : [...current, artifact]);
  }

  function loadQueuedArtifacts() {
    try {
      const raw = localStorage.getItem(REUSE_ARTIFACTS_STORAGE_KEY);
      if (!raw) return;
      const artifacts = JSON.parse(raw) as ArtifactItem[];
      if (Array.isArray(artifacts)) {
        setSelectedArtifacts((current) => {
          const next = [...current];
          for (const artifact of artifacts) {
            if (artifact?.artifactId && !next.some((item) => item.artifactId === artifact.artifactId)) {
              next.push(artifact);
            }
          }
          return next;
        });
      }
      localStorage.removeItem(REUSE_ARTIFACTS_STORAGE_KEY);
    } catch {
      localStorage.removeItem(REUSE_ARTIFACTS_STORAGE_KEY);
    }
  }

  async function onSaveMemory(content = memoryContent) {
    if (!session?.accessToken || !selectedSessionId) return;
    setSavingMemory(true);
    setError(null);
    try {
      const result = await sessionsApi.updateMemory(session.accessToken, selectedSessionId, content);
      setMemoryContent(result.content);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSavingMemory(false);
    }
  }

  async function onRebuildMemory() {
    if (!session?.accessToken || !selectedSessionId) return;
    setSavingMemory(true);
    setError(null);
    try {
      const result = await sessionsApi.rebuildMemory(session.accessToken, selectedSessionId);
      setMemoryContent(result.content);
    } catch (requestError) {
      setError((requestError as ApiError).message);
    } finally {
      setSavingMemory(false);
    }
  }

  function onStreamEvent(event: SessionStreamEvent) {
    const normalized = normalizeStreamEvent(event);
    setLiveEvents((current) => [...current, normalized].slice(-60));
    if ((event.event === "session.failed" || event.event === "request.failed" || event.event === "session.cancelled") && typeof event.data.message === "string") {
      setError(event.data.message);
      setStreamDisconnected(false);
    }
    if (event.event === "summary.completed" && typeof event.data.summary === "string") {
      setSessionDetail((current) => current ? { ...current, summary: event.data.summary as string } : current);
    }
  }

  return (
    <section className="page page--workspace">
      <header className="page-header">
        <div><h1>研究工作台</h1><p>发起研究任务，并查看规划、工具调用和最终产物。</p></div>
        <div className="page-header__meta"><Badge tone="neutral">{sessions.length} 个会话</Badge><Badge tone="neutral">{parseIds(runForm.knowledgeBaseIds).length} 个知识库</Badge></div>
        <StatusPill status={displayRunStatus} />
      </header>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {streamDisconnected ? <Alert tone="warning" title="实时连接中断" action={<Button type="button" variant="secondary" size="sm" onClick={() => selectedSessionId && void loadSessionDetail(selectedSessionId)}>恢复会话详情</Button>}>已保留当前 Agent feed 事件。可以从历史或会话详情恢复服务端结果。</Alert> : null}
      <div className="workspace-shell">
        <section className="workspace-session-rail" aria-label="研究会话">
          <SessionList sessions={sessions} selectedSessionId={selectedSessionId} loading={loadingSessions} creating={creatingSession} form={sessionForm} onFormChange={setSessionForm} onCreate={onCreateSession} onSelect={setSelectedSessionId} onDelete={setSessionToDelete} onRefresh={() => void loadSessions()} />
        </section>
        <main className="workspace-main-flow">
          <ResearchComposer selected={selectedSessionId !== null} sessionStatus={displayRunStatus} form={runForm} selectedArtifacts={selectedArtifacts} knowledgeBases={knowledgeBases} running={runLifecycleActive} canPause={canPauseRun} canResume={canResumeRun} canCancel={canCancelRun} pausing={controlRunAction === "pause"} resuming={controlRunAction === "resume"} cancelling={controlRunAction === "cancel" || activeRunStatus === "CANCEL_REQUESTED"} binding={bindingKnowledgeBases} onFormChange={setRunForm} onSubmit={onRunTask} onCancel={() => void onCancelRun()} onPause={() => void onPauseRun()} onResume={() => void onResumeRun()} onRemoveArtifact={(artifactId) => setSelectedArtifacts((current) => current.filter((artifact) => artifact.artifactId !== artifactId))} onBind={() => void onBindKnowledgeBases()} onRefreshKnowledge={() => void loadKnowledgeBases()} />
          <ExecutionTimeline items={timeline} />
        </main>
        <aside className="workspace-inspector">
          <WorkspaceInspector
            detail={sessionDetail}
            artifacts={sessionDetail?.artifacts ?? []}
            selected={selectedSessionId !== null}
            loading={loadingSessionDetail}
            error={sessionDetailError}
            memoryContent={memoryContent}
            savingMemory={savingMemory}
            toolInvocations={sessionDetail?.toolInvocations ?? []}
            canRestore={selectedSessionId !== null}
            onRestore={() => selectedSessionId && void loadSessionDetail(selectedSessionId)}
            onUseArtifact={onUseArtifact}
            onUpload={onUploadArtifact}
            onMemoryChange={setMemoryContent}
            onMemorySave={() => void onSaveMemory()}
            onMemoryClear={() => void onSaveMemory("")}
            onMemoryRebuild={() => void onRebuildMemory()}
          />
        </aside>
      </div>
      <ConfirmDialog isOpen={sessionToDelete !== null} title="确认删除会话" message={<>确定要删除会话「<strong>{sessionToDelete?.title}</strong>」吗？此操作不可恢复。</>} confirmText={deletingSession ? "删除中" : "删除会话"} cancelText="取消" onConfirm={onDeleteSession} onCancel={() => setSessionToDelete(null)} danger />
    </section>
  );
}

function parseIds(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function isPausableRunStatus(status: string | null) {
  return status === "PENDING" || status === "RUNNING";
}

function isCancelableRunStatus(status: string | null) {
  return status === "PENDING" || status === "RUNNING" || status === "PAUSED";
}
