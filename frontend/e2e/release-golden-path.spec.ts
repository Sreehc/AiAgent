import type { Response } from "@playwright/test";
import { expect, test, type Page } from "./fixtures/test";
import { setupMockApi } from "./fixtures/mockApi";

test("release golden path: login reaches the workspace", async ({ page }) => {
  await setupMockApi(page);

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "登录工作台", exact: true })).toBeVisible();

  await page.getByLabel("用户名", { exact: true }).fill("admin");
  await page.getByLabel("密码", { exact: true }).fill("password");
  await page.getByRole("button", { name: "进入工作台" }).click();

  await expect(page).toHaveURL(/\/workspace\/chat$/);
  await expect(page.getByRole("heading", { name: "研究工作台", exact: true })).toBeVisible();
  await expect(page.getByText("储能行业竞争格局研究").first()).toBeVisible();
});

test("release golden path: admin validates core product flows", async ({ adminPage }) => {
  await test.step("研究：运行研究并查看 Inspector", async () => {
    await adminPage.goto("/workspace/chat");
    await expect(adminPage.getByRole("heading", { name: "研究工作台", exact: true })).toBeVisible();
    await expect(adminPage.getByText("储能行业竞争格局研究").first()).toBeVisible();

    const streamResponse = waitForApi(adminPage, "/sessions/sess-market-001/stream", "POST");
    await adminPage.getByRole("button", { name: "运行研究" }).click();
    expect((await streamResponse).ok()).toBeTruthy();

    await expect(adminPage.getByText("研究完成")).toBeVisible();
    await adminPage.getByRole("tab", { name: "证据" }).click();
    await expect(adminPage.getByLabel("最终证据").getByText("CIT-ESS-001")).toBeVisible();
    await adminPage.getByRole("tab", { name: "工具" }).click();
    await expect(adminPage.getByText("工具调用账本")).toBeVisible();
  });

  await test.step("知识库：执行检索测试并查看证据卡", async () => {
    await adminPage.goto("/workspace/knowledge-bases");
    await expect(adminPage.getByRole("heading", { name: "知识库", exact: true })).toBeVisible();
    await expect(adminPage.getByLabel("RAG cockpit")).toBeVisible();

    const searchResponse = waitForApi(adminPage, "/knowledge-bases/kb-energy/search-test", "POST");
    await adminPage.getByRole("button", { name: "开始检索" }).click();
    expect((await searchResponse).ok()).toBeTruthy();

    const firstHit = adminPage.getByLabel("检索命中 #1");
    await expect(firstHit).toBeVisible();
    await expect(firstHit.getByText("CIT-ESS-001")).toBeVisible();
    await expect(firstHit.getByText("hybrid")).toBeVisible();
  });

  await test.step("图片：生成图片并查看最新输出", async () => {
    await adminPage.goto("/workspace/image-generation");
    await expect(adminPage.getByRole("heading", { name: "图片工作室", exact: true })).toBeVisible();

    const generationResponse = waitForApi(adminPage, "/images/generations", "POST");
    await adminPage.getByRole("button", { name: "生成图片" }).click();
    expect((await generationResponse).ok()).toBeTruthy();

    await expect(adminPage.getByText("img-new-003")).toBeVisible();
    await expect(adminPage.getByText("已生成")).toBeVisible();
  });

  await test.step("历史：查看回放并复用产物", async () => {
    await adminPage.goto("/workspace/history");
    await expect(adminPage.getByRole("heading", { name: "历史回放", exact: true })).toBeVisible();
    await expect(adminPage.getByLabel("历史回放详情")).toBeVisible();
    await expect(adminPage.getByText("报告回放")).toBeVisible();

    await adminPage.getByRole("button", { name: "作为上下文使用" }).first().click();
    await expect(adminPage).toHaveURL(/\/workspace\/chat$/);
    await expect(adminPage.getByText("储能行业竞争格局报告").first()).toBeVisible();
  });

  await test.step("模型：测试连接并保留风险提示", async () => {
    await adminPage.goto("/admin/settings");
    await expect(adminPage.getByRole("heading", { name: "模型配置", exact: true })).toBeVisible();
    await expect(adminPage.getByText("默认模型").first()).toBeVisible();

    const modelRow = adminPage.locator(".model-registry-row").filter({ hasText: "GPT-4.1" });
    const testResponse = waitForApi(adminPage, "/admin/models/openai-gpt-4.1/test", "POST");
    await modelRow.getByRole("button", { name: "测试" }).click();
    expect((await testResponse).ok()).toBeTruthy();
    await expect(adminPage.getByText("openai-gpt-4.1: SUCCESS - 连接正常")).toBeVisible();
  });

  await test.step("MCP：发现工具、健康检查并测试工具", async () => {
    await adminPage.goto("/admin/mcp-servers");
    await expect(adminPage.getByRole("heading", { name: "MCP 服务器", exact: true })).toBeVisible();

    await adminPage.getByRole("button", { name: "发现工具" }).click();
    await expect(adminPage.getByText("browser.search")).toBeVisible();

    await adminPage.getByRole("button", { name: "检查健康" }).click();
    await expect(adminPage.locator(".mcp-health-card").getByText("42 ms")).toBeVisible();

    const toolResponse = waitForApi(adminPage, "/admin/mcp-servers/browser-tools/tools/browser.search/test", "POST");
    await adminPage.getByRole("button", { name: "测试工具" }).click();
    expect((await toolResponse).ok()).toBeTruthy();
    await expect(adminPage.locator(".mcp-tool-test-result").getByText("工具测试通过")).toBeVisible();
  });

  await test.step("审计：筛选失败任务并展开结构化详情", async () => {
    await adminPage.goto("/admin/audit");
    await expect(adminPage.getByRole("heading", { name: "审计", exact: true })).toBeVisible();
    await adminPage.getByRole("combobox", { name: "状态" }).selectOption("FAILED");

    const auditResponse = waitForApi(adminPage, "/admin/audit/runs", "GET");
    await adminPage.getByRole("button", { name: "筛选" }).click();
    expect((await auditResponse).ok()).toBeTruthy();

    await expect(adminPage.getByText("模型 provider 超时")).toBeVisible();
    await adminPage.getByRole("button", { name: "展开" }).first().click();
    await expect(adminPage.getByText("原始审计 payload")).toBeVisible();
  });

  await test.step("RAG：运行评估并展开 metrics 详情", async () => {
    await adminPage.goto("/admin/rag-evaluations");
    await expect(adminPage.getByRole("heading", { name: "RAG 评估", exact: true })).toBeVisible();
    await expect(adminPage.getByLabel("RAG 指标详情")).toBeVisible();

    const ragResponse = waitForApi(adminPage, "/admin/rag-evaluations", "POST");
    await adminPage.getByRole("button", { name: "使用已启用用例运行评估" }).click();
    expect((await ragResponse).ok()).toBeTruthy();

    await expect(adminPage.getByText("eval-001")).toBeVisible();
    await adminPage.getByRole("button", { name: "展开" }).first().click();
    await expect(adminPage.getByText("原始 metrics")).toBeVisible();
  });
});

function waitForApi(page: Page, path: string, method: string): Promise<Response> {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname.endsWith(path) && response.request().method().toUpperCase() === method;
  });
}
