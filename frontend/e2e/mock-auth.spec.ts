import { expect, test } from "./fixtures/test";

test("renders an authenticated workspace with mocked API data", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/workspace/chat");

  await expect(authenticatedPage.getByRole("heading", { name: "研究工作台" })).toBeVisible();
  await expect(authenticatedPage.getByText("储能行业竞争格局研究")).toBeVisible();
});

test("renders the admin overview with mocked admin data", async ({ adminPage }) => {
  await adminPage.goto("/admin/overview");

  await expect(adminPage.getByRole("heading", { name: "管理总览" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "模型配置" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "MCP 健康" })).toBeVisible();
});
