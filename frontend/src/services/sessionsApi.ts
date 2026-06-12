import {
  apiRequest,
  SessionDetailResponse,
  SessionItem,
  SessionListResponse,
  SessionStreamEvent,
  streamRequest
} from "./api";

export type AgentMode = "REACT" | "PLAN_EXECUTE";

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
    payload: { query: string; executionMode: AgentMode; knowledgeBaseIds: string[] },
    onEvent: (event: SessionStreamEvent) => void
  ) => streamRequest(`/sessions/${sessionId}/stream`, payload, accessToken, onEvent)
};
