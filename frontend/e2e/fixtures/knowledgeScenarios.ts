import type { Page, Route } from "@playwright/test";
import { mockApiResponse } from "./mockApi";
import {
  mockKnowledgeBases,
  mockKnowledgeDocuments,
  mockSearchHits
} from "./mockData";

type KnowledgeScenarioName = "empty" | "documents" | "index-failed" | "search-results";

const API_PREFIX = "/api/v1";

const indexedDocument = mockKnowledgeDocuments.find((document) => document.parseStatus === "INDEXED") ?? mockKnowledgeDocuments[0];
const failedDocument = mockKnowledgeDocuments.find((document) => document.parseStatus === "FAILED") ?? mockKnowledgeDocuments[1];

const emptyKnowledgeBase = {
  ...mockKnowledgeBases[0],
  kbId: "kb-empty",
  name: "空白知识库",
  description: "用于验证无文档与无命中的空状态",
  status: "READY",
  documentCount: 0
};

const documentKnowledgeBase = {
  ...mockKnowledgeBases[0],
  documentCount: mockKnowledgeDocuments.length
};

export const knowledgeScenarios = {
  empty: {
    knowledgeBases: [emptyKnowledgeBase],
    documents: [],
    searchHits: []
  },
  documents: {
    knowledgeBases: [documentKnowledgeBase],
    documents: [indexedDocument],
    searchHits: []
  },
  "index-failed": {
    knowledgeBases: [documentKnowledgeBase],
    documents: [indexedDocument, failedDocument],
    searchHits: []
  },
  "search-results": {
    knowledgeBases: [documentKnowledgeBase],
    documents: [indexedDocument, failedDocument],
    searchHits: mockSearchHits
  }
} satisfies Record<KnowledgeScenarioName, { knowledgeBases: unknown[]; documents: unknown[]; searchHits: unknown[] }>;

export async function setupKnowledgeScenario(page: Page, scenarioName: KnowledgeScenarioName) {
  const scenario = knowledgeScenarios[scenarioName];
  const selectedKb = scenario.knowledgeBases[0] as { kbId: string };

  await page.route("**/api/v1/knowledge-bases**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    if (method === "GET" && path === `${API_PREFIX}/knowledge-bases`) {
      return json(route, scenario.knowledgeBases);
    }

    if (method === "GET" && path === `${API_PREFIX}/knowledge-bases/${selectedKb.kbId}/documents`) {
      return json(route, scenario.documents);
    }

    if (method === "POST" && path === `${API_PREFIX}/knowledge-bases/${selectedKb.kbId}/search-test`) {
      return json(route, scenario.searchHits);
    }

    if (method === "GET" && path.includes("/documents/") && path.endsWith("/versions")) {
      return json(route, scenario.documents);
    }

    if (method === "GET" && path.includes("/documents/")) {
      return json(route, {
        document: scenario.documents[0] ?? null,
        preview: "这是用于知识库截图回归的固定文档预览内容。"
      });
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
