import type { Page, Route } from "@playwright/test";
import {
  mockAccountProfile,
  mockAdminModels,
  mockApiConfig,
  mockAuditLoginRows,
  mockAuditRuns,
  mockAuditTools,
  mockAuditUsers,
  mockImageHistory,
  mockInvites,
  mockKnowledgeBases,
  mockKnowledgeDocuments,
  mockLoginLogs,
  mockMcpHealth,
  mockMcpServers,
  mockMcpTools,
  mockRagEvaluationCases,
  mockRagEvaluations,
  mockSearchHits,
  mockSessionDetail,
  mockSessionList,
  mockSessions
} from "./mockData";

type MockSession = typeof mockSessions.user | typeof mockSessions.admin;

const API_PREFIX = "/api/v1";
const AUTH_SESSION_KEY = "aiagent.auth.session";

export function mockApiResponse<T>(data: T, message = "OK") {
  return {
    code: "SUCCESS",
    message,
    data
  };
}

export async function seedAuthSession(page: Page, session: MockSession = mockSessions.user) {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: AUTH_SESSION_KEY, value: session }
  );
}

export async function setupMockApi(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    if (method === "POST" && path === `${API_PREFIX}/auth/login`) {
      return json(route, {
        accessToken: mockSessions.admin.accessToken,
        expiresIn: mockSessions.admin.expiresIn,
        user: mockSessions.admin.user
      });
    }

    if (method === "POST" && path === `${API_PREFIX}/auth/logout`) {
      return json(route, null);
    }

    if (method === "GET" && path === `${API_PREFIX}/sessions`) {
      return json(route, mockSessionList);
    }

    if (method === "POST" && path === `${API_PREFIX}/sessions`) {
      return json(route, {
        ...mockSessionList.items[0],
        sessionId: "sess-created-003",
        title: "新建研究会话",
        status: "IDLE",
        createdAt: "2026-06-20T09:00:00Z"
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/sessions/${mockSessionDetail.session.sessionId}`) {
      return json(route, mockSessionDetail);
    }

    if (method === "POST" && path.startsWith(`${API_PREFIX}/sessions/`) && path.endsWith("/stream")) {
      return stream(route, [
        { event: "session.started", data: { runId: "run-release-001", message: "开始研究" } },
        { event: "tool.completed", data: { toolName: "knowledge.search", message: "检索完成" } },
        { event: "summary.completed", data: { summary: "发布前金路径研究已完成，核心页面可继续回归。" } },
        { event: "session.completed", data: { runId: "run-release-001", status: "COMPLETED" } }
      ]);
    }

    if (method === "GET" && path === `${API_PREFIX}/sessions/${mockSessionDetail.session.sessionId}/replay`) {
      return json(route, mockSessionDetail);
    }

    if (method === "GET" && path === `${API_PREFIX}/sessions/${mockSessionDetail.session.sessionId}/memory`) {
      return json(route, {
        sessionId: mockSessionDetail.session.sessionId,
        content: "偏好：输出先给结论，再列证据；重点关注政策和商业模式。"
      });
    }

    if (method === "GET" && path.startsWith(`${API_PREFIX}/sessions/`) && path.endsWith("/memory")) {
      return json(route, {
        sessionId: path.split("/")[4] ?? "unknown",
        content: ""
      });
    }

    if (method === "POST" && path.includes("/knowledge-bases/bind")) {
      return json(route, {
        sessionId: path.split("/")[4],
        knowledgeBaseIds: ["kb-energy"]
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/knowledge-bases`) {
      return json(route, mockKnowledgeBases);
    }

    if (method === "GET" && path === `${API_PREFIX}/knowledge-bases/kb-energy/documents`) {
      return json(route, mockKnowledgeDocuments);
    }

    if (method === "GET" && path.includes("/documents/") && path.endsWith("/versions")) {
      return json(route, mockKnowledgeDocuments);
    }

    if (method === "GET" && path.includes("/documents/")) {
      return json(route, {
        document: mockKnowledgeDocuments[0],
        preview: "这是用于截图回归的固定文档预览内容。"
      });
    }

    if (method === "POST" && path === `${API_PREFIX}/knowledge-bases/kb-energy/search-test`) {
      return json(route, mockSearchHits);
    }

    if (method === "GET" && path === `${API_PREFIX}/images/history`) {
      return json(route, mockImageHistory);
    }

    if (method === "POST" && path === `${API_PREFIX}/images/generations`) {
      return json(route, {
        jobId: "img-new-003",
        mode: "IMAGES",
        size: "1024x1024",
        sessionId: mockSessionDetail.session.sessionId,
        sourceArtifactId: null,
        artifactId: "art-image-003",
        title: "Mock generated image",
        storageUri: "mock://images/img-new-003.svg",
        mimeType: "image/svg+xml",
        resultUrl: mockImageHistory.items[0].resultUrl,
        createdAt: "2026-06-20T09:00:00Z"
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/account/profile`) {
      return json(route, mockAccountProfile);
    }

    if (method === "GET" && path === `${API_PREFIX}/account/api-config`) {
      return json(route, mockApiConfig);
    }

    if (method === "GET" && path === `${API_PREFIX}/account/login-logs`) {
      return json(route, mockLoginLogs);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/overview`) {
      return json(route, {
        enabledModels: 2,
        totalModels: mockAdminModels.length,
        defaultModel: { modelCode: "openai-gpt-4.1", name: "GPT-4.1", provider: "openai" },
        modelRisks: 1,
        activeMcp: 1,
        totalMcp: mockMcpServers.length,
        mcpRisks: 1,
        auditFailures: 2,
        failedRuns: 1,
        failedLogins: 1,
        ragFailures: 1,
        totalRisks: 5,
        hasAnyData: true,
        risks: [
          { id: "models", title: "模型配置存在风险", description: "1 个启用模型存在 provider 或连接测试风险。", badge: "需关注", tone: "warning" },
          { id: "mcp", title: "MCP 服务未激活", description: "1 个 MCP 服务处于非 ACTIVE 状态。", badge: "需处理", tone: "warning" },
          { id: "audit", title: "近期审计存在失败记录", description: "1 个任务失败，1 次登录失败。", badge: "高优先级", tone: "danger" },
          { id: "rag", title: "RAG 评估存在失败", description: "1 条评估失败或包含错误信息。", badge: "高优先级", tone: "danger" }
        ]
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/models`) {
      return json(route, mockAdminModels);
    }

    if (method === "POST" && path.startsWith(`${API_PREFIX}/admin/models/`) && path.endsWith("/test")) {
      const modelCode = path.split("/").at(-2) ?? "unknown";
      return json(route, {
        modelCode,
        status: modelCode === "local-embedding" ? "FAILED" : "SUCCESS",
        message: modelCode === "local-embedding" ? "本地服务未启动" : "连接正常"
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/invites`) {
      return json(route, mockInvites);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/mcp-servers`) {
      return json(route, mockMcpServers);
    }

    if (method === "POST" && path.endsWith("/discover")) {
      return json(route, mockMcpTools);
    }

    if (method === "GET" && path.endsWith("/health")) {
      return json(route, mockMcpHealth);
    }

    if (method === "POST" && path.startsWith(`${API_PREFIX}/admin/mcp-servers/`) && path.includes("/tools/") && path.endsWith("/test")) {
      const parts = path.split("/");
      const serverCode = parts[5] ?? "unknown";
      const toolName = decodeURIComponent(parts[7] ?? "unknown");
      return json(route, {
        serverCode,
        toolName,
        resultText: "工具测试通过",
        responsePayload: "{\"ok\":true,\"source\":\"release-golden-path\"}"
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/audit/users`) {
      return json(route, mockAuditUsers);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/audit/runs`) {
      return json(route, mockAuditRuns);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/audit/tool-invocations`) {
      return json(route, mockAuditTools);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/audit/login-logs`) {
      return json(route, mockAuditLoginRows);
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/rag-evaluations`) {
      return json(route, mockRagEvaluations);
    }

    if (method === "POST" && path === `${API_PREFIX}/admin/rag-evaluations`) {
      return json(route, {
        evalId: "eval-release-003",
        knowledgeBaseIds: "[\"kb-energy\"]",
        cases: "[{\"query\":\"发布前金路径\"}]",
        metrics: "{\"topK\":10,\"caseCount\":1,\"passedCount\":1,\"failedCount\":0,\"recallAt5\":1,\"recallAt10\":1,\"mrr\":1,\"citationHitRate\":1,\"noResultRate\":0}",
        metricsSummary: {
          topK: 10,
          caseCount: 1,
          passedCount: 1,
          failedCount: 0,
          noResultCount: 0,
          recallAt5: 1,
          recallAt10: 1,
          mrr: 1,
          citationHitRate: 1,
          noResultRate: 0
        },
        status: "COMPLETED",
        errorMessage: null,
        createdAt: "2026-06-20T11:00:00Z",
        completedAt: "2026-06-20T11:01:00Z"
      });
    }

    if (method === "GET" && path === `${API_PREFIX}/admin/rag-evaluation-cases`) {
      return json(route, mockRagEvaluationCases);
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        code: "MOCK_ROUTE_NOT_FOUND",
        message: `No mock response for ${method} ${path}`,
        requestId: "mock-route-not-found"
      })
    });
  });
}

async function json<T>(route: Route, data: T) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(mockApiResponse(data))
  });
}

async function stream(route: Route, events: Array<{ event: string; data: Record<string, unknown> }>) {
  const body = events
    .map((event) => `event: ${event.event}\ndata: ${JSON.stringify(event)}\n\n`)
    .join("");
  await route.fulfill({
    status: 200,
    contentType: "text/event-stream",
    headers: {
      "Cache-Control": "no-cache"
    },
    body
  });
}
