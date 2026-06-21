import { expect, test, type Page } from "./fixtures/test";

const STABLE_ADMIN_SCREENSHOT_CSS = `
  *,
  *::before,
  *::after {
    animation: none !important;
    caret-color: transparent !important;
    transition: none !important;
  }
  .topbar {
    position: static !important;
  }
  @media (min-width: 901px) {
    .app-sidebar {
      position: static !important;
    }
  }
  .skip-link {
    display: none !important;
  }
  iframe {
    visibility: hidden !important;
  }
`;

const ADMIN_STATES = [
  {
    slug: "permission-denied",
    actor: "user",
    path: "/admin/overview"
  },
  {
    slug: "overview",
    actor: "admin",
    path: "/admin/overview"
  },
  {
    slug: "audit-details",
    actor: "admin",
    path: "/admin/audit"
  },
  {
    slug: "rag-details",
    actor: "admin",
    path: "/admin/rag-evaluations"
  }
] as const;

for (const state of ADMIN_STATES) {
  if (state.actor === "admin") {
    test(`captures admin ${state.slug} state`, async ({ adminPage }) => {
      await captureAdminState(adminPage, state);
    });
  } else {
    test(`captures admin ${state.slug} state`, async ({ authenticatedPage }) => {
      await captureAdminState(authenticatedPage, state);
    });
  }
}

async function captureAdminState(page: Page, state: (typeof ADMIN_STATES)[number]) {
  await page.goto(state.path);
  await page.addStyleTag({ content: STABLE_ADMIN_SCREENSHOT_CSS });

  if (state.slug === "permission-denied") {
    await expect(page.getByRole("heading", { name: "管理总览", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "需要管理员权限", exact: true })).toBeVisible();
    await expect(page.getByText("当前账号没有管理员权限，无法访问管理总览。")).toBeVisible();
  }

  if (state.slug === "overview") {
    await expect(page.getByRole("heading", { name: "管理总览", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "模型配置", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "MCP 健康", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "审计失败", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "RAG 评估", exact: true })).toBeVisible();
    await expect(page.getByText("默认模型：GPT-4.1")).toBeVisible();
    await expect(page.getByText("近期审计存在失败记录")).toBeVisible();
    await expect(page.getByText("RAG 评估存在失败")).toBeVisible();
    await expect(page.getByRole("link", { name: "查看审计" })).toHaveAttribute("href", "/admin/audit");
    await expect(page.getByRole("link", { name: "查看评估" })).toHaveAttribute("href", "/admin/rag-evaluations");
  }

  if (state.slug === "audit-details") {
    await expect(page.getByRole("heading", { name: "审计", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "任务" })).toBeVisible();
    await expect(page.getByText("储能行业竞争格局研究")).toBeVisible();
    await expect(page.getByText("模型 provider 超时")).toBeVisible();
    await expect(page.getByText("8.4s")).toBeVisible();
    await page.getByRole("button", { name: "展开" }).first().click();
    await expect(page.getByText("原始审计 payload")).toBeVisible();
    await page.locator("summary").filter({ hasText: "原始审计 payload" }).click();
    await expect(page.getByText("\"provider\": \"local-embedding\"")).toBeVisible();
  }

  if (state.slug === "rag-details") {
    await expect(page.getByRole("heading", { name: "RAG 评估", exact: true })).toBeVisible();
    await expect(page.getByLabel("RAG 指标详情")).toBeVisible();
    await expect(page.getByLabel("RAG 指标详情").getByText("Hit Rate", { exact: true })).toBeVisible();
    await expect(page.getByLabel("RAG 指标详情").getByText("86.0%")).toBeVisible();
    await expect(page.getByText("储能行业竞争格局")).toBeVisible();
    await expect(page.getByText("eval-001")).toBeVisible();
    await page.getByRole("button", { name: "展开" }).first().click();
    await expect(page.getByText("原始 metrics")).toBeVisible();
    await expect(page.getByText("原始评估用例")).toBeVisible();
    await page.locator("summary").filter({ hasText: "原始 metrics" }).click();
    await expect(page.getByText("\"citationHitRate\": 0.86")).toBeVisible();
  }

  await stabilizeForScreenshot(page);

  await expect(page).toHaveScreenshot(`admin/${state.slug}.png`, {
    fullPage: true,
    animations: "disabled",
    maxDiffPixels: 8_000
  });
}

async function stabilizeForScreenshot(page: Page) {
  await page.evaluate(async () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo(0, 0);
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}
