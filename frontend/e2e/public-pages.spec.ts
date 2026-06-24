import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = [
  {
    slug: "login",
    path: "/login",
    heading: "登录工作台",
    labels: ["用户名", "密码"]
  },
  {
    slug: "register-invite",
    path: "/register/invite",
    heading: "创建受邀账号",
    labels: ["邀请码", "用户名", "显示名称", "密码", "确认密码"]
  },
  {
    slug: "forgot-password",
    path: "/forgot-password",
    heading: "找回密码",
    labels: ["用户名或邮箱"]
  },
  {
    slug: "reset-password",
    path: "/reset-password",
    heading: "重置密码",
    labels: ["重置令牌", "新密码", "确认新密码"]
  },
  {
    slug: "not-found",
    path: "/does-not-exist",
    heading: "页面不存在",
    labels: ["404 返回路径"]
  }
] as const;

const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  test.describe(`${theme} public pages`, () => {
    test(`captures ${theme} public page screenshots`, async ({ page }) => {
      for (const pageCase of PUBLIC_PAGES) {
        await page.addInitScript((theme) => {
          window.localStorage.setItem("aiagent.theme", theme);
        }, theme);

        await page.goto(pageCase.path);

        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(page.getByRole("heading", { name: pageCase.heading })).toBeVisible();

        for (const label of pageCase.labels) {
          await expect(page.getByLabel(label, { exact: true })).toBeVisible();
        }

        await expect(page).toHaveScreenshot(`public-pages/${theme}/${pageCase.slug}.png`, {
          fullPage: true,
          animations: "disabled"
        });

        await expect(
          page.evaluate(() => document.documentElement.dataset.theme)
        ).resolves.toBe(theme);
      }
    });
  });
}
