import {
  apiRequest,
  InviteItem,
  McpDiscoverResponse,
  McpHealthResponse,
  McpServerItem,
  ModelConfigItem
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

export type McpServerPayload = {
  name: string;
  serverCode?: string;
  transportType: "SSE" | "STDIO" | "STREAMABLE_HTTP";
  endpoint: string;
  commandLine: string | null;
  active?: boolean;
};

export const adminApi = {
  listModels: (accessToken: string) => apiRequest<ModelConfigItem[]>("/admin/models", {}, accessToken),
  createModel: (accessToken: string, payload: ModelConfigPayload) =>
    apiRequest<ModelConfigItem>("/admin/models", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  listInvites: (accessToken: string, limit = 10) =>
    apiRequest<InviteItem[]>(`/admin/invites?limit=${limit}`, {}, accessToken),
  createInvite: (accessToken: string, expiresInDays: number) =>
    apiRequest<InviteItem>(
      "/admin/invites",
      { method: "POST", body: JSON.stringify({ expiresInDays }) },
      accessToken
    ),
  listMcpServers: (accessToken: string) => apiRequest<McpServerItem[]>("/admin/mcp-servers", {}, accessToken),
  createMcpServer: (accessToken: string, payload: McpServerPayload) =>
    apiRequest<McpServerItem>("/admin/mcp-servers", { method: "POST", body: JSON.stringify(payload) }, accessToken),
  updateMcpServer: (accessToken: string, serverCode: string, payload: McpServerPayload) =>
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
    apiRequest<McpHealthResponse>(`/admin/mcp-servers/${serverCode}/health`, {}, accessToken)
};
