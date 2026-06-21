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
  assertContains("package.json", /"test:knowledge-e2e-screenshots":\s*"node scripts\/verify-knowledge-e2e-screenshots\.mjs"/, "package script should expose the T05 verifier");

  assertExists("e2e/knowledge.spec.ts", "Knowledge E2E screenshot spec should exist");
  assertContains("e2e/knowledge.spec.ts", /from\s+["']\.\/fixtures\/test["']/, "knowledge spec should use authenticated mock fixtures");
  assertContains("e2e/knowledge.spec.ts", /from\s+["']\.\/fixtures\/knowledgeScenarios["']/, "knowledge spec should use dedicated knowledge scenarios");
  assertContains("e2e/knowledge.spec.ts", /KNOWLEDGE_STATES/, "knowledge spec should define screenshot states");
  assertContains("e2e/knowledge.spec.ts", /empty/, "knowledge spec should cover empty state");
  assertContains("e2e/knowledge.spec.ts", /documents/, "knowledge spec should cover document table state");
  assertContains("e2e/knowledge.spec.ts", /index-failed/, "knowledge spec should cover indexing failure state");
  assertContains("e2e/knowledge.spec.ts", /search-results/, "knowledge spec should cover retrieval hit state");
  assertContains("e2e/knowledge.spec.ts", /\/workspace\/knowledge-bases/, "knowledge spec should visit the knowledge route");
  assertContains("e2e/knowledge.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']开始检索["']\s*\}\)\.click\(\)/, "knowledge spec should run retrieval search");
  assertContains("e2e/knowledge.spec.ts", /getByLabel\(["']检索命中 #1["']\)/, "knowledge spec should verify the first retrieval evidence card");
  assertContains("e2e/knowledge.spec.ts", /CIT-ESS-001/, "knowledge spec should verify citation IDs");
  assertContains("e2e/knowledge.spec.ts", /0\.9100/, "knowledge spec should verify formatted retrieval score");
  assertContains("e2e/knowledge.spec.ts", /energy-storage-market-2026\.pdf/, "knowledge spec should verify source file names");
  assertContains("e2e/knowledge.spec.ts", /第 4 节标题层级无法解析/, "knowledge spec should verify indexing failure details");
  assertContains("e2e/knowledge.spec.ts", /toHaveScreenshot/, "knowledge spec should capture screenshots");
  assertContains("e2e/knowledge.spec.ts", /knowledge\/\$\{state\.slug\}\.png/, "knowledge screenshots should be grouped by knowledge state");

  assertExists("e2e/fixtures/knowledgeScenarios.ts", "Knowledge scenario fixtures should exist");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /knowledgeScenarios/, "knowledge scenario fixtures should export scenario data");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /empty/, "knowledge scenarios should include empty state data");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /documents/, "knowledge scenarios should include document table data");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /index-failed/, "knowledge scenarios should include indexing failure data");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /search-results/, "knowledge scenarios should include retrieval hit data");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /setupKnowledgeScenario/, "knowledge scenario fixtures should provide a setup helper");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /page\.route\(["']\*\*\/api\/v1\/knowledge-bases/, "knowledge scenario setup should override knowledge API calls");
  assertContains("e2e/fixtures/knowledgeScenarios.ts", /search-test/, "knowledge scenario setup should override retrieval search calls");

  assertContains("../docs/tasks.md", /\| T05 \| 已完成 \|[\s\S]*knowledge\.spec\.ts[\s\S]*文档表格[\s\S]*索引失败[\s\S]*检索命中[\s\S]*空态/, "docs/tasks.md should record T05 completion");
}

try {
  main();
  console.log("Knowledge E2E screenshot verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
