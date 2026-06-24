import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function assertFile(path, message) {
  if (!existsSync(resolve(rootDir, path))) {
    throw new Error(`${path}: ${message}`);
  }
}

function assertContains(filePath, pattern, message) {
  const content = readProjectFile(filePath);
  if (!pattern.test(content)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function main() {
  assertFile("src/pages/AdminOverviewPage.tsx", "Admin overview page should exist");

  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ Link \} from "react-router-dom"/, "Overview cards should drill down with router links");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ Alert \} from "\.\.\/components\/ui\/Alert"/, "Overview should use shared Alert feedback");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ Badge \} from "\.\.\/components\/ui\/Badge"/, "Overview should use shared Badge labels");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ Button \} from "\.\.\/components\/ui\/Button"/, "Overview should use shared Button actions");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ EmptyState \} from "\.\.\/components\/ui\/EmptyState"/, "Overview should use shared EmptyState for denied\/empty states");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ Panel \} from "\.\.\/components\/ui\/Panel"/, "Overview should use shared Panel surfaces");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ useAuthSession \} from "\.\.\/hooks\/useAuthSession"/, "Overview should check the current auth session");
  assertContains("src/pages/AdminOverviewPage.tsx", /import \{ adminApi \} from "\.\.\/services\/adminApi"/, "Overview should use the admin overview API");

  assertContains("src/pages/AdminOverviewPage.tsx", /session\?\.user\.roles\.includes\("ADMIN"\)/, "Overview should keep the admin-only guard");
  assertContains("src/pages/AdminOverviewPage.tsx", /adminApi\.getOverview\(session\.accessToken\)/, "Overview should load backend-normalized summary");
  assertContains("src/services/adminApi.ts", /getOverview:\s*\(accessToken: string\) => apiRequest<AdminOverviewResponse>\("\/admin\/overview"/, "Admin API should expose the overview endpoint");

  assertContains("src/pages/AdminOverviewPage.tsx", /admin-overview-grid/, "Overview should render a stable metrics grid");
  assertContains("src/pages/AdminOverviewPage.tsx", /admin-overview-card/, "Overview should render stable metric cards");
  assertContains("src/pages/AdminOverviewPage.tsx", /admin-overview-card__metric/, "Overview cards should expose stable metric text");
  assertContains("src/pages/AdminOverviewPage.tsx", /admin-overview-risk-list/, "Overview should render a stable risk list");
  assertContains("src/pages/AdminOverviewPage.tsx", /admin-overview-actions/, "Overview should render stable drilldown actions");
  assertContains("src/pages/AdminOverviewPage.tsx", /\/admin\/settings/, "Overview should link to model settings");
  assertContains("src/pages/AdminOverviewPage.tsx", /\/admin\/mcp-servers/, "Overview should link to MCP servers");
  assertContains("src/pages/AdminOverviewPage.tsx", /\/admin\/audit/, "Overview should link to audit");
  assertContains("src/pages/AdminOverviewPage.tsx", /\/admin\/rag-evaluations/, "Overview should link to RAG evaluations");

  assertContains("src/router/AppRouter.tsx", /import \{ AdminOverviewPage \} from "\.\.\/pages\/AdminOverviewPage"/, "Router should import the admin overview page");
  assertContains("src/router/AppRouter.tsx", /<Route path="\/admin\/overview" element=\{<AdminOverviewPage \/>\} \/>/, "Router should expose /admin/overview");

  assertContains("src/components/shell/navigation.ts", /\/admin\/overview/, "Admin navigation should include the overview route");
  assertContains("src/components/shell/navigation.ts", /label: "管理总览"/, "Admin navigation should label the overview route");

  assertContains("src/styles/pages.css", /\.admin-overview-grid\s*\{/, "Overview grid should have dedicated styles");
  assertContains("src/styles/pages.css", /\.admin-overview-card\s*\{/, "Overview cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.admin-overview-card__metric\s*\{/, "Overview metric text should have dedicated styles");
  assertContains("src/styles/pages.css", /\.admin-overview-risk-list\s*\{/, "Overview risk list should have dedicated styles");
  assertContains("src/styles/pages.css", /\.admin-overview-actions\s*\{/, "Overview drilldown actions should have dedicated styles");

  assertContains("package.json", /"test:admin-overview":\s*"node scripts\/verify-admin-overview\.mjs"/, "package script should expose the A01 verifier");
  assertContains("../docs/tasks.md", /\| A01 \| 已完成 \|[\s\S]*AdminOverviewPage[\s\S]*模型、MCP、审计、RAG 风险[\s\S]*普通用户无权限[\s\S]*指标可跳转/, "docs/tasks.md should record A01 completion");
}

try {
  main();
  console.log("Admin overview verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
