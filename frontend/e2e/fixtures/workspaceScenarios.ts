import type { Page, Route } from "@playwright/test";
import { mockApiResponse } from "./mockApi";
import {
  mockEvidence,
  mockKnowledgeBases,
  mockSessionDetail
} from "./mockData";

type WorkspaceScenarioName = "empty" | "running" | "completed" | "failed";

const API_PREFIX = "/api/v1";

const runningDetail = {
  ...mockSessionDetail,
  session: {
    ...mockSessionDetail.session,
    sessionId: "sess-running-002",
    title: "欧洲碳关税影响追踪",
    agentMode: "REACT",
    status: "RUNNING",
    createdAt: "2026-06-19T11:20:00Z"
  },
  runs: [
    {
      ...mockSessionDetail.runs[0],
      runId: "run-running-002",
      query: "追踪欧洲碳关税对中国电池出口的影响",
      retrievalQuery: "欧洲 碳关税 电池 出口",
      executionMode: "REACT",
      status: "RUNNING",
      completedAt: null,
      finalEvidenceSet: [],
      errorMessage: null
    }
  ],
  planSteps: [
    {
      stepNo: 1,
      title: "检索政策更新时间线",
      status: "COMPLETED",
      toolName: "knowledge.search",
      toolInput: "{\"query\":\"CBAM battery export\"}",
      toolOutput: "{\"hits\":1}",
      observation: "找到政策时间线",
      completionJudgement: "继续补充企业影响",
      startedAt: "2026-06-19T11:21:00Z",
      completedAt: "2026-06-19T11:21:30Z"
    },
    {
      stepNo: 2,
      title: "分析企业出口影响",
      status: "RUNNING",
      toolName: "web.search",
      toolInput: "{\"query\":\"battery exporters CBAM\"}",
      toolOutput: null,
      observation: "正在整理来源",
      completionJudgement: null,
      startedAt: "2026-06-19T11:22:00Z",
      completedAt: null
    }
  ],
  toolInvocations: [
    {
      toolCallId: "tool-running-001",
      toolName: "web.search",
      toolType: "MCP",
      status: "RUNNING",
      requestPayload: "{\"query\":\"battery exporters CBAM\"}",
      responsePayload: null,
      startedAt: "2026-06-19T11:22:00Z",
      endedAt: null
    }
  ],
  artifacts: [],
  summary: null,
  knowledgeBaseIds: ["kb-energy"]
};

const failedDetail = {
  ...mockSessionDetail,
  session: {
    ...mockSessionDetail.session,
    sessionId: "sess-failed-003",
    title: "供应链风险研究",
    agentMode: "PLAN_EXECUTE",
    status: "FAILED",
    createdAt: "2026-06-19T14:00:00Z"
  },
  runs: [
    {
      ...mockSessionDetail.runs[0],
      runId: "run-failed-003",
      query: "分析供应链中断对储能项目交付的影响",
      retrievalQuery: "供应链 中断 储能 交付",
      executionMode: "PLAN_EXECUTE",
      status: "FAILED",
      completedAt: "2026-06-19T14:03:00Z",
      finalEvidenceSet: [],
      recallSet: mockEvidence.slice(0, 1),
      errorMessage: "模型 provider 超时，请稍后重试。"
    }
  ],
  planSteps: [
    {
      stepNo: 1,
      title: "检索供应链风险证据",
      status: "FAILED",
      toolName: "knowledge.search",
      toolInput: "{\"query\":\"供应链 中断 储能\"}",
      toolOutput: "{\"error\":\"provider timeout\"}",
      observation: "模型 provider 超时",
      completionJudgement: "失败",
      startedAt: "2026-06-19T14:01:00Z",
      completedAt: "2026-06-19T14:03:00Z"
    }
  ],
  toolInvocations: [
    {
      toolCallId: "tool-failed-001",
      toolName: "knowledge.search",
      toolType: "RAG",
      status: "FAILED",
      requestPayload: "{\"query\":\"供应链 中断 储能\"}",
      responsePayload: "{\"error\":\"provider timeout\"}",
      startedAt: "2026-06-19T14:01:00Z",
      endedAt: "2026-06-19T14:03:00Z"
    }
  ],
  artifacts: [],
  summary: null,
  knowledgeBaseIds: ["kb-energy"]
};

export const workspaceScenarios = {
  empty: {
    sessionList: {
      pageNo: 1,
      pageSize: 20,
      items: []
    },
    details: {}
  },
  running: {
    sessionList: {
      pageNo: 1,
      pageSize: 20,
      items: [runningDetail.session]
    },
    details: {
      [runningDetail.session.sessionId]: runningDetail
    }
  },
  completed: {
    sessionList: {
      pageNo: 1,
      pageSize: 20,
      items: [mockSessionDetail.session]
    },
    details: {
      [mockSessionDetail.session.sessionId]: mockSessionDetail
    }
  },
  failed: {
    sessionList: {
      pageNo: 1,
      pageSize: 20,
      items: [failedDetail.session]
    },
    details: {
      [failedDetail.session.sessionId]: failedDetail
    }
  }
} satisfies Record<WorkspaceScenarioName, { sessionList: { pageNo: number; pageSize: number; items: unknown[] }; details: Record<string, typeof mockSessionDetail> }>;

export async function setupWorkspaceScenario(page: Page, scenarioName: WorkspaceScenarioName) {
  const scenario = workspaceScenarios[scenarioName];

  await page.route("**/api/v1/sessions**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    if (method === "GET" && path === `${API_PREFIX}/sessions`) {
      return json(route, scenario.sessionList);
    }

    if (method === "GET" && path.startsWith(`${API_PREFIX}/sessions/`) && path.endsWith("/memory")) {
      const sessionId = path.split("/")[4] ?? "unknown";
      return json(route, {
        sessionId,
        content: scenarioName === "empty" ? "" : "偏好：输出先给结论，再列证据。"
      });
    }

    if (method === "GET" && path.startsWith(`${API_PREFIX}/sessions/`)) {
      const sessionId = path.split("/")[4] ?? "";
      const detail = scenario.details[sessionId];
      if (detail) {
        return json(route, detail);
      }
    }

    return route.fallback();
  });

  await page.route("**/api/v1/knowledge-bases", async (route) => {
    if (route.request().method().toUpperCase() === "GET") {
      return json(route, scenarioName === "empty" ? [] : mockKnowledgeBases);
    }
    return route.fallback();
  });
}

async function json<T>(route: Route, data: T) {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(mockApiResponse(data))
  });
}
