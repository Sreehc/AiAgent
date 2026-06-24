import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function assertContains(filePath, pattern, message) {
  const content = readProjectFile(filePath);
  if (!pattern.test(content)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function assertNotContains(filePath, pattern, message) {
  const content = readProjectFile(filePath);
  if (pattern.test(content)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function main() {
  assertContains("src/services/api.ts", /healthState:\s*"healthy" \| "unhealthy" \| "unknown"/, "MCP health response should expose backend-normalized healthState");
  assertContains("src/services/api.ts", /riskCodes:\s*string\[\]/, "Model response should expose backend risk codes");
  assertContains("src/services/api.ts", /riskReasons:\s*string\[\]/, "Model response should expose backend risk reasons");
  assertContains("src/services/api.ts", /export type AdminOverviewResponse/, "Admin overview should use a backend summary DTO");
  assertContains("src/services/api.ts", /export type RagMetricsSummary/, "RAG evaluations should expose structured metrics summary");

  assertContains("src/services/adminApi.ts", /getOverview:\s*\(accessToken: string\) => apiRequest<AdminOverviewResponse>\("\/admin\/overview"/, "Admin API should expose backend overview endpoint");

  assertContains("src/pages/AdminOverviewPage.tsx", /adminApi\.getOverview/, "Admin overview page should load the backend overview summary");
  assertNotContains("src/pages/AdminOverviewPage.tsx", /Promise\.allSettled\(\[/, "Admin overview page should not stitch risk facts from multiple frontend calls");

  assertContains("src/pages/AdminSettingsPage.tsx", /model\.riskLevel/, "Model settings should render backend model risk level");
  assertContains("src/pages/AdminSettingsPage.tsx", /model\.riskCodes\.includes\("LAST_TEST_FAILED"\)/, "Model settings should use backend risk codes for model failure summaries");
  assertNotContains("src/pages/AdminSettingsPage.tsx", /model\.riskReasons\.includes\("最近连接测试非 SUCCESS"\)/, "Model settings should not use display copy as model risk logic");
  assertNotContains("src/pages/AdminSettingsPage.tsx", /provider === "local-mock" \|\| \(model\.lastTestStatus !== null && model\.lastTestStatus !== "SUCCESS"\)/, "Model settings should not duplicate provider/test risk policy");
  assertContains("src/features/system/ModelRegistry.tsx", /model\.riskLevel/, "Model registry rows should use backend risk level");
  assertNotContains("src/features/system/ModelRegistry.tsx", /provider === "local-mock".*return "danger"/s, "Model registry should not classify local-mock risk itself");

  assertContains("src/pages/McpServersPage.tsx", /health\.healthState/, "MCP page should use backend-normalized health state");
  assertContains("src/features/system/McpServerRegistry.tsx", /health\.healthState/, "MCP registry should use backend-normalized health state");
  assertNotContains("src/features/system/McpServerRegistry.tsx", /\["ACTIVE", "HEALTHY", "SUCCESS", "OK"\]/, "MCP registry should not maintain health status aliases");

  assertContains("src/pages/AdminAuditPage.tsx", /keys: \["createdAt"\]/, "Audit columns should target stable backend DTO fields");
  assertNotContains("src/pages/AdminAuditPage.tsx", /keys: \["createdAt", "timestamp", "time"\]/, "Audit columns should not guess timestamp aliases");

  assertContains("src/pages/RagEvaluationPage.tsx", /metricsSummary/, "RAG evaluation page should consume structured metricsSummary");
  assertNotContains("src/pages/RagEvaluationPage.tsx", /const fallbackCases = JSON\.parse\(DEFAULT_CASES\)/, "RAG evaluation should not silently run built-in fallback cases");

  assertContains("e2e/fixtures/mockData.ts", /status: "UP"/, "Playwright MCP mock should mirror backend UP/DOWN health status");
  assertContains("e2e/fixtures/mockData.ts", /healthState: "healthy"/, "Playwright MCP mock should include normalized healthState");

  assertContains("package.json", /"test:business-boundaries":\s*"node scripts\/verify-business-boundaries\.mjs"/, "package script should expose the business boundary verifier");
}

try {
  main();
  console.log("Business boundary verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
