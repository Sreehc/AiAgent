import { expect, test } from "./fixtures/test";
import { setupKnowledgeScenario } from "./fixtures/knowledgeScenarios";

const KNOWLEDGE_STATES = [
  {
    slug: "empty",
    expectedText: "没有文档",
    search: false
  },
  {
    slug: "documents",
    expectedText: "energy-storage-market-2026.pdf",
    search: false
  },
  {
    slug: "index-failed",
    expectedText: "第 4 节标题层级无法解析",
    search: false
  },
  {
    slug: "search-results",
    expectedText: "检索命中 #1",
    search: true
  }
] as const;

for (const state of KNOWLEDGE_STATES) {
  test(`captures knowledge ${state.slug} state`, async ({ authenticatedPage }) => {
    await setupKnowledgeScenario(authenticatedPage, state.slug);

    await authenticatedPage.goto("/workspace/knowledge-bases");
    await authenticatedPage.addStyleTag({
      content: `
        .topbar,
        .workspace-rail,
        .workspace-inspector {
          position: static !important;
          max-height: none !important;
        }
        .upload-row {
          display: none !important;
        }
        iframe {
          visibility: hidden !important;
        }
      `
    });

    await expect(authenticatedPage.getByRole("heading", { name: "知识库", exact: true })).toBeVisible();
    await expect(authenticatedPage.getByLabel("RAG cockpit")).toBeVisible();

    if (state.slug === "empty") {
      await expect(authenticatedPage.getByRole("heading", { name: "空白知识库" })).toBeVisible();
      await expect(authenticatedPage.getByText("没有文档")).toBeVisible();
      await expect(authenticatedPage.getByText("输入问题后可验证当前知识库的召回片段。")).toBeVisible();
    }

    if (state.slug === "documents" || state.slug === "index-failed" || state.slug === "search-results") {
      await expect(authenticatedPage.getByText("energy-storage-market-2026.pdf")).toBeVisible();
      await expect(authenticatedPage.getByText("已索引").first()).toBeVisible();
      await expect(authenticatedPage.getByText("v3")).toBeVisible();
      await expect(authenticatedPage.getByText("36 chunks").first()).toBeVisible();
    }

    if (state.slug === "index-failed" || state.slug === "search-results") {
      await expect(authenticatedPage.getByText("grid-policy-brief.md")).toBeVisible();
      await expect(authenticatedPage.getByText("索引失败").first()).toBeVisible();
      await expect(authenticatedPage.getByText("第 4 节标题层级无法解析")).toBeVisible();
      await expect(authenticatedPage.getByRole("button", { name: "重试索引：grid-policy-brief.md" })).toBeVisible();
    }

    const firstSearchHit = authenticatedPage.getByLabel("检索命中 #1");

    if (state.search) {
      await authenticatedPage.getByRole("button", { name: "开始检索" }).click();

      await expect(firstSearchHit).toBeVisible();
      await expect(firstSearchHit.getByText("#1")).toBeVisible();
      await expect(firstSearchHit.getByText("0.9100")).toBeVisible();
      await expect(firstSearchHit.getByText("energy-storage-market-2026.pdf")).toBeVisible();
      await expect(firstSearchHit.getByText("CIT-ESS-001")).toBeVisible();
      await expect(firstSearchHit.getByText("Market structure")).toBeVisible();
      await expect(firstSearchHit.getByText("chunk 7")).toBeVisible();
      await expect(firstSearchHit.getByText("hybrid")).toBeVisible();
      await expect(firstSearchHit.getByText("2026 年储能装机增速预计保持高位")).toBeVisible();
    } else {
      await expect(authenticatedPage.getByText(state.expectedText).first()).toBeVisible();
    }

    await authenticatedPage.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    if (state.slug === "search-results" && test.info().project.name === "chromium-mobile") {
      await firstSearchHit.scrollIntoViewIfNeeded();
      await authenticatedPage.evaluate(() => {
        window.scrollBy(0, -24);
      });
      const screenshot = await authenticatedPage.screenshot({
        animations: "disabled"
      });
      expect(screenshot).toMatchSnapshot(`knowledge/${state.slug}.png`);
    } else {
      await expect(authenticatedPage).toHaveScreenshot(`knowledge/${state.slug}.png`, {
        fullPage: true,
        animations: "disabled"
      });
    }
  });
}
