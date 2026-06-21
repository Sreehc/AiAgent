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
  assertContains("package.json", /"test:release-golden-path":\s*"node scripts\/verify-release-golden-path\.mjs"/, "package script should expose the T08 verifier");

  assertExists("e2e/release-golden-path.spec.ts", "Release golden path E2E spec should exist");
  assertContains("e2e/release-golden-path.spec.ts", /setupMockApi/, "release spec should use stable mocked API data");
  assertContains("e2e/release-golden-path.spec.ts", /\/login/, "release spec should cover login");
  assertContains("e2e/release-golden-path.spec.ts", /\/workspace\/chat/, "release spec should cover research workspace");
  assertContains("e2e/release-golden-path.spec.ts", /\/workspace\/knowledge-bases/, "release spec should cover knowledge bases");
  assertContains("e2e/release-golden-path.spec.ts", /\/workspace\/image-generation/, "release spec should cover image studio");
  assertContains("e2e/release-golden-path.spec.ts", /\/workspace\/history/, "release spec should cover history replay");
  assertContains("e2e/release-golden-path.spec.ts", /\/admin\/settings/, "release spec should cover model settings");
  assertContains("e2e/release-golden-path.spec.ts", /\/admin\/mcp-servers/, "release spec should cover MCP servers");
  assertContains("e2e/release-golden-path.spec.ts", /\/admin\/audit/, "release spec should cover audit");
  assertContains("e2e/release-golden-path.spec.ts", /\/admin\/rag-evaluations/, "release spec should cover RAG evaluations");
  assertContains("e2e/release-golden-path.spec.ts", /运行研究/, "release spec should verify research operation entry");
  assertContains("e2e/release-golden-path.spec.ts", /开始检索/, "release spec should verify knowledge search");
  assertContains("e2e/release-golden-path.spec.ts", /生成图片/, "release spec should verify image generation");
  assertContains("e2e/release-golden-path.spec.ts", /作为上下文使用/, "release spec should verify history artifact reuse");
  assertContains("e2e/release-golden-path.spec.ts", /测试连接/, "release spec should verify model connection test");
  assertContains("e2e/release-golden-path.spec.ts", /健康检查/, "release spec should verify MCP health check");
  assertContains("e2e/release-golden-path.spec.ts", /筛选/, "release spec should verify audit filter path");
  assertContains("e2e/release-golden-path.spec.ts", /使用已启用用例运行评估/, "release spec should verify RAG evaluation run");

  assertContains("e2e/fixtures/mockApi.ts", /\/auth\/login/, "mock API should support login for release golden path");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/models\/.+\/test/, "mock API should support model connection tests");
  assertContains("e2e/fixtures/mockApi.ts", /\/admin\/mcp-servers\/.+\/tools\/.+\/test/, "mock API should support MCP tool tests");
  assertContains("e2e/fixtures/mockApi.ts", /POST["']\s*&&\s*path\s*===\s*`\$\{API_PREFIX\}\/admin\/rag-evaluations`/, "mock API should support creating RAG evaluations");

  assertContains("../docs/tasks.md", /\| T08 \| 已完成 \|[\s\S]*release-golden-path\.spec\.ts[\s\S]*登录[\s\S]*研究[\s\S]*知识库[\s\S]*图片[\s\S]*历史[\s\S]*模型[\s\S]*MCP[\s\S]*审计[\s\S]*RAG/, "docs/tasks.md should record T08 completion");
}

try {
  main();
  console.log("Release golden path verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
