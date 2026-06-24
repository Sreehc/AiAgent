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
  assertContains("package.json", /"test:workspace-e2e-screenshots":\s*"node scripts\/verify-workspace-e2e-screenshots\.mjs"/, "package script should expose the T04 verifier");

  assertExists("e2e/workspace.spec.ts", "Workspace E2E screenshot spec should exist");
  assertContains("e2e/workspace.spec.ts", /from\s+["']\.\/fixtures\/test["']/, "workspace spec should use authenticated mock fixtures");
  assertContains("e2e/workspace.spec.ts", /WORKSPACE_STATES/, "workspace spec should define screenshot states");
  assertContains("e2e/workspace.spec.ts", /empty/, "workspace spec should cover empty state");
  assertContains("e2e/workspace.spec.ts", /running/, "workspace spec should cover running state");
  assertContains("e2e/workspace.spec.ts", /completed/, "workspace spec should cover completed state");
  assertContains("e2e/workspace.spec.ts", /failed/, "workspace spec should cover failed state");
  assertContains("e2e/workspace.spec.ts", /\/workspace\/chat/, "workspace spec should visit the workspace route");
  assertContains("e2e/workspace.spec.ts", /getByRole\(["']tab["'],\s*\{\s*name:\s*["']证据["']\s*\}/, "workspace spec should switch to the evidence inspector tab");
  assertContains("e2e/workspace.spec.ts", /getByRole\(["']tab["'],\s*\{\s*name:\s*["']工具["']\s*\}/, "workspace spec should switch to the tool inspector tab");
  assertContains("e2e/workspace.spec.ts", /locator\(["']summary["']\)\.filter\(\{\s*hasText:\s*["']请求 payload["']\s*\}\)\.click\(\)/, "workspace spec should expand a tool payload");
  assertContains("e2e/workspace.spec.ts", /toHaveScreenshot/, "workspace spec should capture screenshots");
  assertContains("e2e/workspace.spec.ts", /workspace\/\$\{state\.slug\}\.png/, "workspace screenshots should be grouped by workspace state");

  assertExists("e2e/fixtures/workspaceScenarios.ts", "Workspace scenario fixtures should exist");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /workspaceScenarios/, "workspace scenario fixtures should export scenario data");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /empty/, "workspace scenarios should include empty state data");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /running/, "workspace scenarios should include running state data");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /completed/, "workspace scenarios should include completed state data");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /failed/, "workspace scenarios should include failed state data");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /setupWorkspaceScenario/, "workspace scenario fixtures should provide a setup helper");
  assertContains("e2e/fixtures/workspaceScenarios.ts", /page\.route\(["']\*\*\/api\/v1\/sessions/, "workspace scenario setup should override session API calls");

  assertContains("../docs/tasks.md", /\| T04 \| 已完成 \|[\s\S]*workspace\.spec\.ts[\s\S]*空态、运行中、完成、失败[\s\S]*Inspector Tabs[\s\S]*payload 展开/, "docs/tasks.md should record T04 completion");
}

try {
  main();
  console.log("Workspace E2E screenshot verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
