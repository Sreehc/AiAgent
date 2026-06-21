import { expect, test } from "./fixtures/test";
import { setupImageScenario } from "./fixtures/imageScenarios";

const STABLE_IMAGE_SCREENSHOT_CSS = `
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
  .image-studio-layout__controls,
  .image-selection-toolbar {
    position: static !important;
  }
  .skip-link {
    display: none !important;
  }
  iframe {
    visibility: hidden !important;
  }
`;

const IMAGE_FAVORITES_STORAGE_KEY = "aiagent:image-favorites:v1";
const IMAGE_FAVORITES_RESET_SESSION_KEY = "aiagent:e2e-image-favorites-reset";
const IMAGE_SNAPSHOT_OPTIONS = {
  maxDiffPixels: 8_000
};
const IMAGE_COMPARE_SNAPSHOT_OPTIONS = {
  maxDiffPixelRatio: 0.05
};

const IMAGE_STATES = [
  {
    slug: "empty",
    scenario: "empty",
    mode: "empty"
  },
  {
    slug: "history",
    scenario: "history",
    mode: "history"
  },
  {
    slug: "selection",
    scenario: "history",
    mode: "selection"
  },
  {
    slug: "compare",
    scenario: "history",
    mode: "compare"
  },
  {
    slug: "download",
    scenario: "history",
    mode: "download"
  }
] as const;

for (const state of IMAGE_STATES) {
  test(`captures image studio ${state.slug} state`, async ({ authenticatedPage }) => {
    await setupImageScenario(authenticatedPage, state.scenario);
    await authenticatedPage.addInitScript(
      ({ favoriteKey, resetKey }) => {
        if (!window.sessionStorage.getItem(resetKey)) {
          window.localStorage.removeItem(favoriteKey);
          window.sessionStorage.setItem(resetKey, "true");
        }
      },
      {
        favoriteKey: IMAGE_FAVORITES_STORAGE_KEY,
        resetKey: IMAGE_FAVORITES_RESET_SESSION_KEY
      }
    );
    await authenticatedPage.goto("/workspace/image-generation");
    await authenticatedPage.addStyleTag({
      content: STABLE_IMAGE_SCREENSHOT_CSS
    });

    await expect(authenticatedPage.getByRole("heading", { name: "图片工作室", exact: true })).toBeVisible();
    await expect(authenticatedPage.getByLabel("图片输出与历史")).toBeVisible();

    if (state.mode === "empty") {
      await expect(authenticatedPage.getByText("暂无生成结果")).toBeVisible();
      await expect(authenticatedPage.getByText("暂无图片历史")).toBeVisible();
    }

    if (state.mode !== "empty") {
      await expect(authenticatedPage.getByText("A clean research report cover about energy storage market")).toBeVisible();
      await expect(authenticatedPage.getByText("参考图格式不受支持").first()).toBeVisible();
      await expect(authenticatedPage.getByText("图片预览加载失败").first()).toBeVisible();
      await expect(authenticatedPage.getByText("5 总数")).toBeVisible();
      await expect(authenticatedPage.getByText("4 完成")).toBeVisible();
      await expect(authenticatedPage.getByText("1 失败")).toBeVisible();
    }

    if (state.mode === "selection" || state.mode === "compare" || state.mode === "download") {
      await authenticatedPage.getByRole("button", { name: "选择", exact: true }).click();
      await authenticatedPage.getByLabel("选择图片 A clean research report cover about energy storage market").check();
      await authenticatedPage.getByLabel("选择图片 Graphite and teal market chart for grid-side storage").check();
      await expect(authenticatedPage.getByText("2 已选")).toBeVisible();
      await expect(authenticatedPage.locator("[data-selected='true']")).toHaveCount(2);

      await authenticatedPage.getByRole("button", { name: "收藏图片" }).first().click();
      await expect(authenticatedPage.getByText("已加入收藏")).toBeVisible();
      await expect(authenticatedPage.getByText("已收藏")).toBeVisible();

      await authenticatedPage.reload();
      await authenticatedPage.addStyleTag({
        content: STABLE_IMAGE_SCREENSHOT_CSS
      });
      await expect(authenticatedPage.getByText("已收藏")).toBeVisible();
      await expect(authenticatedPage.getByText("1 收藏")).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "选择", exact: true }).click();
      await authenticatedPage.getByLabel("选择图片 A clean research report cover about energy storage market").check();
      await authenticatedPage.getByLabel("选择图片 Graphite and teal market chart for grid-side storage").check();
    }

    if (state.mode === "compare") {
      await authenticatedPage.getByLabel("选择图片 Refine policy briefing illustration with restrained cyan accents").check();
      await authenticatedPage.getByLabel("选择图片 Remote benchmark image that should fall back to manual download").check();
      await authenticatedPage.getByLabel("选择图片 Failed reference image task for screenshot coverage").check();
      await expect(authenticatedPage.getByText("5 已选")).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "对比图片" }).click();
      await expect(authenticatedPage.getByRole("dialog", { name: "图片对比" })).toBeVisible();
      await expect(authenticatedPage.getByText("超过 4 张时仅展示前 4 张，请减少选择以聚焦细节。")).toBeVisible();
      await expect(authenticatedPage.locator(".image-compare-card")).toHaveCount(4);
    }

    if (state.mode === "download") {
      await authenticatedPage.getByLabel("选择图片 Remote benchmark image that should fall back to manual download").check();
      await expect(authenticatedPage.getByText("3 已选")).toBeVisible();
      await authenticatedPage.getByRole("button", { name: "下载集合" }).click();
      await expect(authenticatedPage.getByText(/部分图片无法直接下载|已开始下载/)).toBeVisible();
      await expect(authenticatedPage.getByText("img-cross-origin：")).toBeVisible();
    }

    await authenticatedPage.evaluate(async () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.scrollTo(0, 0);
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });

    if (state.slug === "compare") {
      const dialog = authenticatedPage.getByRole("dialog", { name: "图片对比" });
      const screenshot = await dialog.screenshot({
        animations: "disabled"
      });
      expect(screenshot).toMatchSnapshot(`image/${state.slug}.png`, IMAGE_COMPARE_SNAPSHOT_OPTIONS);
      return;
    }

    const shouldUseBufferSnapshot = state.slug === "selection" || state.slug === "download";

    if (shouldUseBufferSnapshot) {
      const screenshot = await authenticatedPage.screenshot({
        animations: "disabled",
        fullPage: true
      });
      expect(screenshot).toMatchSnapshot(`image/${state.slug}.png`, IMAGE_SNAPSHOT_OPTIONS);
    } else {
      await expect(authenticatedPage).toHaveScreenshot(`image/${state.slug}.png`, {
        fullPage: true,
        animations: "disabled",
        ...IMAGE_SNAPSHOT_OPTIONS
      });
    }
  });
}
