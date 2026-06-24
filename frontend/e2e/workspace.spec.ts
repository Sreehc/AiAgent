import { expect, test } from "./fixtures/test";
import { setupWorkspaceScenario } from "./fixtures/workspaceScenarios";

const WORKSPACE_STATES = [
  {
    slug: "empty",
    statusText: "准备运行",
    expectedText: "先创建或选择一个会话"
  },
  {
    slug: "running",
    statusText: "正在研究",
    expectedText: "欧洲碳关税影响追踪"
  },
  {
    slug: "completed",
    statusText: "研究完成",
    expectedText: "储能行业竞争格局报告"
  },
  {
    slug: "failed",
    statusText: "研究失败",
    expectedText: "模型 provider 超时"
  }
] as const;

for (const state of WORKSPACE_STATES) {
  test(`captures workspace ${state.slug} state`, async ({ authenticatedPage }) => {
    await setupWorkspaceScenario(authenticatedPage, state.slug);

    await authenticatedPage.goto("/workspace/chat");

    await expect(authenticatedPage.getByRole("heading", { name: "研究工作台" })).toBeVisible();
    await expect(authenticatedPage.getByText(state.statusText)).toBeVisible();
    await expect(authenticatedPage.getByText(state.expectedText).first()).toBeVisible();

    if (state.slug === "completed") {
      await authenticatedPage.getByRole("tab", { name: "证据" }).click();
      await expect(authenticatedPage.getByText("最终证据", { exact: true })).toBeVisible();
      await expect(authenticatedPage.getByLabel("最终证据").getByText("CIT-ESS-001")).toBeVisible();

      await authenticatedPage.getByRole("tab", { name: "工具" }).click();
      await expect(authenticatedPage.getByText("工具调用账本")).toBeVisible();
      await authenticatedPage.locator("summary").filter({ hasText: "请求 payload" }).click();
      await expect(authenticatedPage.getByText("\"query\": \"储能 行业 增速\"")).toBeVisible();
    }

    await expect(authenticatedPage).toHaveScreenshot(`workspace/${state.slug}.png`, {
      fullPage: true,
      animations: "disabled"
    });
  });
}
