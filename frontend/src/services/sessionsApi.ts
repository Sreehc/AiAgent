import {
  apiRequest,
  RunItem,
  SessionDetailResponse,
  SessionItem,
  SessionListResponse,
  SessionStreamEvent,
  streamRequest
} from "./api";

export type AgentMode = "REACT" | "PLAN_EXECUTE";
export type StrategyMode = "AUTO" | "MANUAL";

export const sessionsApi = {
  list: (accessToken: string, pageNo = 1, pageSize = 20) =>
    apiRequest<SessionListResponse>(`/sessions?pageNo=${pageNo}&pageSize=${pageSize}`, {}, accessToken),
  get: (accessToken: string, sessionId: string) =>
    apiRequest<SessionDetailResponse>(`/sessions/${sessionId}`, {}, accessToken),
  replay: (accessToken: string, sessionId: string) =>
    apiRequest<SessionDetailResponse>(`/sessions/${sessionId}/replay`, {}, accessToken),
  create: (accessToken: string, payload: { title: string; agentMode: AgentMode }) =>
    apiRequest<SessionItem>("/sessions", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  remove: (accessToken: string, sessionId: string) =>
    apiRequest<void>(`/sessions/${sessionId}`, { method: "DELETE" }, accessToken),
  bindKnowledgeBases: (accessToken: string, sessionId: string, knowledgeBaseIds: string[]) =>
    apiRequest<{ sessionId: string; knowledgeBaseIds: string[] }>(
      `/sessions/${sessionId}/knowledge-bases/bind`,
      { method: "POST", body: JSON.stringify({ knowledgeBaseIds }) },
      accessToken
    ),
  streamRun: (
    accessToken: string,
    sessionId: string,
    payload: { query: string; executionMode: AgentMode; strategyMode?: StrategyMode; knowledgeBaseIds: string[]; artifactIds?: string[] },
    onEvent: (event: SessionStreamEvent) => void
  ) => streamRequest(`/sessions/${sessionId}/stream`, payload, accessToken, onEvent),
  cancelRun: (accessToken: string, sessionId: string, runId: string, reason?: string) =>
    apiRequest<RunItem>(`/sessions/${sessionId}/runs/${runId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }, accessToken),
  pauseRun: (accessToken: string, sessionId: string, runId: string, reason?: string) =>
    apiRequest<RunItem>(`/sessions/${sessionId}/runs/${runId}/pause`, { method: "POST", body: JSON.stringify({ reason }) }, accessToken),
  resumeRun: (accessToken: string, sessionId: string, runId: string) =>
    apiRequest<RunItem>(`/sessions/${sessionId}/runs/${runId}/resume`, { method: "POST" }, accessToken),
  getMemory: (accessToken: string, sessionId: string) =>
    apiRequest<{ sessionId: string; content: string }>(`/sessions/${sessionId}/memory`, {}, accessToken),
  updateMemory: (accessToken: string, sessionId: string, content: string) =>
    apiRequest<{ sessionId: string; content: string }>(`/sessions/${sessionId}/memory`, { method: "PUT", body: JSON.stringify({ content }) }, accessToken),
  rebuildMemory: (accessToken: string, sessionId: string) =>
    apiRequest<{ sessionId: string; content: string }>(`/sessions/${sessionId}/memory/rebuild`, { method: "POST" }, accessToken)
};
