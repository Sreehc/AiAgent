import type { Page, Route } from "@playwright/test";
import { mockApiResponse } from "./mockApi";
import { mockSessionList } from "./mockData";

type ImageScenarioName = "empty" | "history";

const API_PREFIX = "/api/v1";

function svgDataUrl(label: string, fill: string) {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="42" fill="${fill}" />
      <circle cx="378" cy="134" r="68" fill="rgba(255,255,255,0.22)" />
      <path d="M72 348c56-74 112-112 168-112 47 0 86 28 118 84 24-24 50-36 78-36 20 0 38 6 54 18v142H72z" fill="rgba(255,255,255,0.28)" />
      <text x="64" y="112" fill="white" font-size="42" font-family="Arial, sans-serif" font-weight="700">${label}</text>
    </svg>
  `)}`;
}

export const imageHistoryItems = [
  {
    jobId: "img-ess-cover",
    mode: "IMAGES",
    prompt: "A clean research report cover about energy storage market",
    size: "1024x1024",
    sessionId: "sess-market-001",
    sourceArtifactId: null,
    resultArtifactId: "art-image-001",
    status: "COMPLETED",
    errorMessage: null,
    resultUrl: svgDataUrl("Energy", "#0f766e"),
    createdAt: "2026-06-18T10:00:00Z"
  },
  {
    jobId: "img-grid-chart",
    mode: "IMAGES",
    prompt: "Graphite and teal market chart for grid-side storage",
    size: "1536x1024",
    sessionId: "sess-market-001",
    sourceArtifactId: null,
    resultArtifactId: "art-image-002",
    status: "COMPLETED",
    errorMessage: null,
    resultUrl: svgDataUrl("Grid", "#155e75"),
    createdAt: "2026-06-18T10:05:00Z"
  },
  {
    jobId: "img-policy-edit",
    mode: "EDITS",
    prompt: "Refine policy briefing illustration with restrained cyan accents",
    size: "1024x1024",
    sessionId: "sess-running-002",
    sourceArtifactId: "art-image-001",
    resultArtifactId: "art-image-003",
    status: "COMPLETED",
    errorMessage: null,
    resultUrl: svgDataUrl("Policy", "#334155"),
    createdAt: "2026-06-18T10:10:00Z"
  },
  {
    jobId: "img-cross-origin",
    mode: "IMAGES",
    prompt: "Remote benchmark image that should fall back to manual download",
    size: "1024x1536",
    sessionId: null,
    sourceArtifactId: null,
    resultArtifactId: "art-image-004",
    status: "COMPLETED",
    errorMessage: null,
    resultUrl: "https://assets.invalid/aiagent/remote-download.png",
    createdAt: "2026-06-18T10:15:00Z"
  },
  {
    jobId: "img-failed-ref",
    mode: "EDITS",
    prompt: "Failed reference image task for screenshot coverage",
    size: "1024x1024",
    sessionId: "sess-market-001",
    sourceArtifactId: "art-image-001",
    resultArtifactId: null,
    status: "FAILED",
    errorMessage: "参考图格式不受支持",
    resultUrl: null,
    createdAt: "2026-06-18T10:20:00Z"
  }
] as const;

export const imageScenarios = {
  empty: {
    history: {
      pageNo: 1,
      pageSize: 12,
      items: []
    }
  },
  history: {
    history: {
      pageNo: 1,
      pageSize: 12,
      items: imageHistoryItems
    }
  }
} satisfies Record<ImageScenarioName, { history: { pageNo: number; pageSize: number; items: unknown[] } }>;

export async function setupImageScenario(page: Page, scenarioName: ImageScenarioName) {
  const scenario = imageScenarios[scenarioName];

  await page.route("https://assets.invalid/**", async (route) => {
    await route.abort("failed");
  });

  await page.route("**/api/v1/images/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method().toUpperCase();

    if (method === "GET" && path === `${API_PREFIX}/images/history`) {
      return json(route, scenario.history);
    }

    if (method === "POST" && path === `${API_PREFIX}/images/generations`) {
      return json(route, {
        jobId: "img-generated-now",
        mode: "IMAGES",
        size: "1024x1024",
        sessionId: mockSessionList.items[0].sessionId,
        sourceArtifactId: null,
        artifactId: "art-image-generated-now",
        title: "Generated screenshot image",
        storageUri: "mock://images/generated-now.svg",
        mimeType: "image/svg+xml",
        resultUrl: imageHistoryItems[0].resultUrl,
        createdAt: "2026-06-20T09:00:00Z"
      });
    }

    return route.fallback();
  });

  await page.route("**/api/v1/sessions**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method().toUpperCase() === "GET" && url.pathname === `${API_PREFIX}/sessions`) {
      return json(route, mockSessionList);
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
