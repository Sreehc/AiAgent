import {
  apiRequest,
  AdminAuditRow,
  InviteItem,
  McpDiscoverResponse,
  McpHealthResponse,
  McpServerItem,
  ModelConfigItem,
  RagEvaluationItem
  , RagEvaluationCaseItem
} from "./api";

export type ModelConfigPayload = {
  modelCode: string;
  name: string;
  provider: string;
  modelType: "CHAT" | "EMBEDDING" | "IMAGE";
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
};

export type McpTransportType = "SSE" | "STDIO" | "STREAMABLE_HTTP";

export type CreateMcpServerPayload = {
  name: string;
  serverCode: string;
  transportType: McpTransportType;
  endpoint: string | null;
  commandLine: string | null;
};

export type UpdateMcpServerPayload = {
  name: string;
  transportType: McpTransportType;
  endpoint: string | null;
  commandLine: string | null;
  active: boolean;
};

export type AuditQuery = {
  keyword?: string;
  status?: string;
  result?: string;
  pageNo?: number;
  pageSize?: number;
};

function auditQuery(params: AuditQuery = {}) {
  const searchParams = new URLSearchParams();
  if (params.keyword) searchParams.set("keyword", params.keyword);
  if (params.status) searchParams.set("status", params.status);
  if (params.result) searchParams.set("result", params.result);
  searchParams.set("pageNo", String(params.pageNo ?? 1));
  searchParams.set("pageSize", String(params.pageSize ?? 50));
  return searchParams.toString();
}

export const adminApi = {
  listModels: (accessToken: string) => apiRequest<ModelConfigItem[]>("/admin/models", {}, accessToken),
  createModel: (accessToken: string, payload: ModelConfigPayload) =>
    apiRequest<ModelConfigItem>("/admin/models", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  updateModel: (accessToken: string, modelCode: string, payload: Omit<ModelConfigPayload, "modelCode">) =>
    apiRequest<ModelConfigItem>(`/admin/models/${modelCode}`, { method: "PUT", body: JSON.stringify(payload) }, accessToken),
  enableModel: (accessToken: string, modelCode: string) =>
    apiRequest<ModelConfigItem>(`/admin/models/${modelCode}/enable`, { method: "POST" }, accessToken),
  disableModel: (accessToken: string, modelCode: string) =>
    apiRequest<ModelConfigItem>(`/admin/models/${modelCode}/disable`, { method: "POST" }, accessToken),
  deleteModel: (accessToken: string, modelCode: string) =>
    apiRequest<void>(`/admin/models/${modelCode}`, { method: "DELETE" }, accessToken),
  testModel: (accessToken: string, modelCode: string) =>
    apiRequest<{ modelCode: string; status: string; message: string }>(`/admin/models/${modelCode}/test`, { method: "POST" }, accessToken),
  setDefaultModel: (accessToken: string, modelCode: string) =>
    apiRequest<ModelConfigItem>(`/admin/models/${modelCode}/default`, { method: "POST" }, accessToken),
  listInvites: (accessToken: string, limit = 10) =>
    apiRequest<InviteItem[]>(`/admin/invites?limit=${limit}`, {}, accessToken),
  createInvite: (accessToken: string, expiresInDays: number) =>
    apiRequest<InviteItem>(
      "/admin/invites",
      { method: "POST", body: JSON.stringify({ expiresInDays }) },
      accessToken
    ),
  listMcpServers: (accessToken: string) => apiRequest<McpServerItem[]>("/admin/mcp-servers", {}, accessToken),
  createMcpServer: (accessToken: string, payload: CreateMcpServerPayload) =>
    apiRequest<McpServerItem>("/admin/mcp-servers", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  updateMcpServer: (accessToken: string, serverCode: string, payload: UpdateMcpServerPayload) =>
    apiRequest<McpServerItem>(
      `/admin/mcp-servers/${serverCode}`,
      { method: "PUT", body: JSON.stringify(payload) },
      accessToken
    ),
  deleteMcpServer: (accessToken: string, serverCode: string) =>
    apiRequest<void>(`/admin/mcp-servers/${serverCode}`, { method: "DELETE" }, accessToken),
  discoverMcpTools: (accessToken: string, serverCode: string) =>
    apiRequest<McpDiscoverResponse>(`/admin/mcp-servers/${serverCode}/discover`, { method: "POST" }, accessToken),
  checkMcpHealth: (accessToken: string, serverCode: string) =>
    apiRequest<McpHealthResponse>(`/admin/mcp-servers/${serverCode}/health`, {}, accessToken),
  testMcpTool: (accessToken: string, serverCode: string, toolName: string, input: string) =>
    apiRequest<{ serverCode: string; toolName: string; resultText: string; responsePayload: string }>(
      `/admin/mcp-servers/${serverCode}/tools/${toolName}/test`,
      { method: "POST", body: JSON.stringify({ input }) },
      accessToken
    ),
  listAuditUsers: (accessToken: string, params?: AuditQuery) => apiRequest<AdminAuditRow[]>(`/admin/audit/users?${auditQuery(params)}`, {}, accessToken),
  listAuditRuns: (accessToken: string, params?: AuditQuery) =>
    apiRequest<AdminAuditRow[]>(`/admin/audit/runs?${auditQuery(params)}`, {}, accessToken),
  listAuditTools: (accessToken: string, params?: AuditQuery) =>
    apiRequest<AdminAuditRow[]>(`/admin/audit/tool-invocations?${auditQuery(params)}`, {}, accessToken),
  listAuditLogins: (accessToken: string, params?: AuditQuery) => apiRequest<AdminAuditRow[]>(`/admin/audit/login-logs?${auditQuery(params)}`, {}, accessToken),
  createRagEvaluation: (accessToken: string, payload: { topK: number; knowledgeBaseIds?: string[]; cases: Array<{ query: string; expectedCitationIds: string[]; expectedTextContains: string[] }> }) =>
    apiRequest<RagEvaluationItem>("/admin/rag-evaluations", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  listRagEvaluations: (accessToken: string) => apiRequest<RagEvaluationItem[]>("/admin/rag-evaluations", {}, accessToken),
  listRagEvaluationCases: (accessToken: string) => apiRequest<RagEvaluationCaseItem[]>("/admin/rag-evaluation-cases", {}, accessToken),
  createRagEvaluationCase: (accessToken: string, payload: { query: string; expectedCitationIds: string[]; expectedTextContains: string[]; enabled: boolean }) =>
    apiRequest<RagEvaluationCaseItem>("/admin/rag-evaluation-cases", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  updateRagEvaluationCase: (accessToken: string, caseId: string, payload: { query: string; expectedCitationIds: string[]; expectedTextContains: string[]; enabled: boolean }) =>
    apiRequest<RagEvaluationCaseItem>(`/admin/rag-evaluation-cases/${caseId}`, { method: "PUT", body: JSON.stringify(payload) }, accessToken),
  deleteRagEvaluationCase: (accessToken: string, caseId: string) =>
    apiRequest<void>(`/admin/rag-evaluation-cases/${caseId}`, { method: "DELETE" }, accessToken)
};
