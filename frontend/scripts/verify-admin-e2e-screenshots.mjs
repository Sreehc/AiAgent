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
  assertContains("package.json", /"test:admin-e2e-screenshots":\s*"node scripts\/verify-admin-e2e-screenshots\.mjs"/, "package script should expose the T07 verifier");

  assertExists("e2e/admin.spec.ts", "Admin E2E screenshot spec should exist");
  assertContains("e2e/admin.spec.ts", /from\s+["']\.\/fixtures\/test["']/, "admin spec should use authenticated mock fixtures");
  assertContains("e2e/admin.spec.ts", /ADMIN_STATES/, "admin spec should define screenshot states");
  assertContains("e2e/admin.spec.ts", /\/admin\/overview/, "admin spec should visit the admin overview route");
  assertContains("e2e/admin.spec.ts", /\/admin\/audit/, "admin spec should visit the audit route");
  assertContains("e2e/admin.spec.ts", /\/admin\/rag-evaluations/, "admin spec should visit the RAG evaluation route");
  assertContains("e2e/admin.spec.ts", /authenticatedPage/, "admin spec should verify ordinary user permission behavior");
  assertContains("e2e/admin.spec.ts", /adminPage/, "admin spec should verify admin-visible pages");
  assertContains("e2e/admin.spec.ts", /需要管理员权限|当前账号没有管理员权限/, "admin spec should assert permission denied copy for ordinary users");
  assertContains("e2e/admin.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']展开["']\s*\}\)/, "admin spec should expand structured details");
  assertContains("e2e/admin.spec.ts", /原始审计 payload/, "admin spec should verify audit raw payload fallback");
  assertContains("e2e/admin.spec.ts", /原始 metrics/, "admin spec should verify RAG metrics detail");
  assertContains("e2e/admin.spec.ts", /Hit Rate/, "admin spec should verify structured RAG metrics");
  assertContains("e2e/admin.spec.ts", /模型配置/, "admin spec should verify overview risk cards");
  assertContains("e2e/admin.spec.ts", /toHaveScreenshot|toMatchSnapshot/, "admin spec should capture screenshots");
  assertContains("e2e/admin.spec.ts", /admin\/\$\{state\.slug\}\.png/, "admin screenshots should be grouped by admin state");

  assertContains("../docs/tasks.md", /\| T07 \| 已完成 \|[\s\S]*admin\.spec\.ts[\s\S]*管理总览[\s\S]*审计[\s\S]*RAG 评估[\s\S]*无权限/, "docs/tasks.md should record T07 completion");
}

try {
  main();
  console.log("Admin E2E screenshot verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
