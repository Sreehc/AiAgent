import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function assertExists(path, message) {
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
  assertContains("package.json", /"test:playwright-mocks":\s*"node scripts\/verify-playwright-mocks\.mjs"/, "package script should expose the T02 verifier");

  assertExists("e2e/fixtures/mockData.ts", "Playwright mock data should exist");
  assertContains("e2e/fixtures/mockData.ts", /mockSessions/, "mock data should include authenticated user sessions");
  assertContains("e2e/fixtures/mockData.ts", /roles:\s*\["USER"\]/, "mock data should include a normal user session");
  assertContains("e2e/fixtures/mockData.ts", /roles:\s*\["ADMIN"\]/, "mock data should include an admin session");
  assertContains("e2e/fixtures/mockData.ts", /mockSessionList/, "mock data should include session list data");
  assertContains("e2e/fixtures/mockData.ts", /mockSessionDetail/, "mock data should include session detail data");
  assertContains("e2e/fixtures/mockData.ts", /mockKnowledgeBases/, "mock data should include knowledge base data");
  assertContains("e2e/fixtures/mockData.ts", /mockKnowledgeDocuments/, "mock data should include document data");
  assertContains("e2e/fixtures/mockData.ts", /mockSearchHits/, "mock data should include search hit data");
  assertContains("e2e/fixtures/mockData.ts", /mockImageHistory/, "mock data should include image history data");
  assertContains("e2e/fixtures/mockData.ts", /mockAccountProfile/, "mock data should include account profile data");
  assertContains("e2e/fixtures/mockData.ts", /mockApiConfig/, "mock data should include account API config data");
  assertContains("e2e/fixtures/mockData.ts", /mockLoginLogs/, "mock data should include login log data");
  assertContains("e2e/fixtures/mockData.ts", /mockAdminModels/, "mock data should include admin model data");
  assertContains("e2e/fixtures/mockData.ts", /mockMcpServers/, "mock data should include MCP server data");
  assertContains("e2e/fixtures/mockData.ts", /mockAuditRuns/, "mock data should include audit data");
  assertContains("e2e/fixtures/mockData.ts", /mockRagEvaluations/, "mock data should include RAG evaluation data");

  assertExists("e2e/fixtures/mockApi.ts", "Playwright mock API helper should exist");
  assertContains("e2e/fixtures/mockApi.ts", /mockApiResponse/, "mock API should expose an API response envelope helper");
  assertContains("e2e/fixtures/mockApi.ts", /seedAuthSession/, "mock API should expose an auth session seeding helper");
  assertContains("e2e/fixtures/mockApi.ts", /setupMockApi/, "mock API should expose a route setup helper");
  assertContains("e2e/fixtures/mockApi.ts", /page\.route\(["']\*\*\/api\/v1\/\*\*["']/, "mock API should intercept all /api/v1 requests");
  assertContains("e2e/fixtures/mockApi.ts", /status:\s*404/, "mock API should return a deterministic unsupported-route fallback");
  assertContains("e2e/fixtures/mockApi.ts", /\/sessions/, "mock API should handle session requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/knowledge-bases/, "mock API should handle knowledge base requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/images\/history/, "mock API should handle image history requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/models/, "mock API should handle admin model requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/mcp-servers/, "mock API should handle admin MCP requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/audit\/runs/, "mock API should handle admin audit requests");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/rag-evaluations/, "mock API should handle admin RAG evaluation requests");

  assertExists("e2e/fixtures/test.ts", "Playwright fixture extension should exist");
  assertContains("e2e/fixtures/test.ts", /(test|base)\.extend/, "fixtures should extend Playwright test");
  assertContains("e2e/fixtures/test.ts", /mockApi/, "fixtures should expose mockApi");
  assertContains("e2e/fixtures/test.ts", /authenticatedPage/, "fixtures should expose an authenticated user page");
  assertContains("e2e/fixtures/test.ts", /adminPage/, "fixtures should expose an admin page");
  assertContains("e2e/fixtures/test.ts", /export\s+\{\s*expect\s*\}/, "fixtures should re-export expect");

  assertExists("e2e/mock-auth.spec.ts", "An authenticated smoke spec should exist");
  assertContains("e2e/mock-auth.spec.ts", /from\s+["']\.\/fixtures\/test["']/, "authenticated smoke should use shared fixtures");
  assertContains("e2e/mock-auth.spec.ts", /authenticatedPage/, "authenticated smoke should cover a user route");
  assertContains("e2e/mock-auth.spec.ts", /adminPage/, "authenticated smoke should cover an admin route");
  assertContains("e2e/mock-auth.spec.ts", /\/workspace\/chat/, "authenticated smoke should visit the workspace");
  assertContains("e2e/mock-auth.spec.ts", /\/admin\/overview/, "authenticated smoke should visit the admin overview");

  assertContains("../docs/tasks.md", /\| T02 \| 已完成 \|[\s\S]*Playwright fixtures[\s\S]*mock API[\s\S]*普通用户\/admin 登录态/, "docs/tasks.md should record T02 completion");
}

try {
  main();
  console.log("Playwright mock verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
