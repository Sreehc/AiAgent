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

function main() {
  assertContains("src/pages/McpServersPage.tsx", /const mcpSummary = buildMcpSummary\(servers, healthChecks\)/, "MCP page should derive summary metrics");
  assertContains("src/pages/McpServersPage.tsx", /const \[toolTestResults, setToolTestResults\] = useState/, "MCP page should keep tool test results in-page");
  assertContains("src/pages/McpServersPage.tsx", /setToolTestResults\(\(current\) => \(\{ \.\.\.current, \[result\.toolName\]: result \}\)\)/, "Tool test success should be stored by tool name");
  assertContains("src/pages/McpServersPage.tsx", /className="mcp-summary-grid"/, "MCP page should render summary cards");
  assertContains("src/pages/McpServersPage.tsx", /mcpSummary\.unhealthyServers\.length/, "MCP page should count unhealthy servers");
  assertContains("src/pages/McpServersPage.tsx", /MCP 健康风险/, "MCP page should show a health risk alert");
  assertContains("src/pages/McpServersPage.tsx", /testResults=\{toolTestResults\}/, "MCP page should pass tool test results to the tool list");

  assertContains("src/features/system/McpServerRegistry.tsx", /className="mcp-server-list"/, "Registry should use a dedicated server list");
  assertContains("src/features/system/McpServerRegistry.tsx", /className=\{`mcp-server-card/, "Registry server cards should have stable classes");
  assertContains("src/features/system/McpServerRegistry.tsx", /data-health=\{getHealthState\(server, healthChecks\[server\.serverCode\]\)\}/, "Registry cards should expose health state");
  assertContains("src/features/system/McpServerRegistry.tsx", /StatusPill status=\{healthChecks\[server\.serverCode\]\?\.status \?\? server\.status\}/, "Registry should highlight health status");
  assertContains("src/features/system/McpServerRegistry.tsx", /server\.transportType/, "Registry should show transport type");
  assertContains("src/features/system/McpServerRegistry.tsx", /healthChecks\[server\.serverCode\]\?\.latencyMs/, "Registry should show latency when available");
  assertContains("src/features/system/McpServerRegistry.tsx", /healthChecks\[server\.serverCode\]\?\.toolCount/, "Registry should show tool count when available");

  assertContains("src/features/system/McpToolList.tsx", /testResults: Record<string, McpToolTestResult>/, "Tool list should accept test results");
  assertContains("src/features/system/McpToolList.tsx", /export type McpToolTestResult/, "Tool test result type should be exported");
  assertContains("src/features/system/McpToolList.tsx", /className="mcp-tool-grid"/, "Tool list should use a dedicated grid");
  assertContains("src/features/system/McpToolList.tsx", /className="mcp-tool-card"/, "Discovered tools should render as cards");
  assertContains("src/features/system/McpToolList.tsx", /className="mcp-health-card"/, "Health details should render as a structured card");
  assertContains("src/features/system/McpToolList.tsx", /latencyMs/, "Health card should show latency");
  assertContains("src/features/system/McpToolList.tsx", /toolCount/, "Health card should show tool count");
  assertContains("src/features/system/McpToolList.tsx", /transportType/, "Health card should show transport type");
  assertContains("src/features/system/McpToolList.tsx", /testResults\[tool\.toolName\]/, "Tool cards should render the latest test result");
  assertContains("src/features/system/McpToolList.tsx", /resultText/, "Tool cards should show successful test output text");
  assertContains("src/features/system/McpToolList.tsx", /onTestTool\(tool\.toolName\)/, "Tool test action should remain wired");

  assertContains("src/styles/pages.css", /\.mcp-summary-grid\s*\{/, "MCP summary grid should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-summary-card\s*\{/, "MCP summary cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-server-list\s*\{/, "MCP server list should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-server-card\s*\{/, "MCP server cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-server-card\[data-health="unhealthy"\]/, "Unhealthy server cards should have risk styling");
  assertContains("src/styles/pages.css", /\.mcp-tool-grid\s*\{/, "MCP tool grid should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-tool-card\s*\{/, "MCP tool cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-health-card\s*\{/, "MCP health card should have dedicated styles");
  assertContains("src/styles/pages.css", /\.mcp-tool-test-result\s*\{/, "Tool test results should have dedicated styles");

  assertContains("package.json", /"test:mcp-page-upgrade":\s*"node scripts\/verify-mcp-page-upgrade\.mjs"/, "package script should expose the A03 verifier");
  assertContains("../docs/tasks.md", /\| A03 \| 已完成 \|[\s\S]*McpServersPage[\s\S]*McpServerRegistry[\s\S]*McpToolList[\s\S]*unhealthy、transport、tools、health 信息清晰[\s\S]*测试结果不走错误样式/, "docs/tasks.md should record A03 completion");
}

try {
  main();
  console.log("MCP page upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
