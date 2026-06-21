import { expect, test } from "@playwright/test";

test("renders the public login experience", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: /登录工作台/ })).toBeVisible();
  await expect(page.getByLabel("用户名")).toBeVisible();
  await expect(page.getByLabel("密码")).toBeVisible();
  await expect(page.getByRole("button", { name: "进入工作台" })).toBeVisible();
});
