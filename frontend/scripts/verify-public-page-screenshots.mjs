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
  assertContains("package.json", /"test:public-page-screenshots":\s*"node scripts\/verify-public-page-screenshots\.mjs"/, "package script should expose the T03 verifier");

  assertExists("e2e/public-pages.spec.ts", "Public page screenshot spec should exist");
  assertContains("e2e/public-pages.spec.ts", /PUBLIC_PAGES/, "spec should define the public page matrix");
  assertContains("e2e/public-pages.spec.ts", /THEMES/, "spec should define the light and dark theme matrix");
  assertContains("e2e/public-pages.spec.ts", /\/login/, "spec should cover the login route");
  assertContains("e2e/public-pages.spec.ts", /\/register\/invite/, "spec should cover the invite registration route");
  assertContains("e2e/public-pages.spec.ts", /\/forgot-password/, "spec should cover the forgot password route");
  assertContains("e2e/public-pages.spec.ts", /\/reset-password/, "spec should cover the reset password route");
  assertContains("e2e/public-pages.spec.ts", /\/does-not-exist/, "spec should cover a 404 route");
  assertContains("e2e/public-pages.spec.ts", /"light"/, "spec should cover the light theme");
  assertContains("e2e/public-pages.spec.ts", /"dark"/, "spec should cover the dark theme");
  assertContains("e2e/public-pages.spec.ts", /localStorage\.setItem\("aiagent\.theme", theme\)/, "spec should force the requested theme before page load");
  assertContains("e2e/public-pages.spec.ts", /document\.documentElement\.dataset\.theme/, "spec should assert the resolved theme");
  assertContains("e2e/public-pages.spec.ts", /toHaveScreenshot/, "spec should capture Playwright visual snapshots");
  assertContains("e2e/public-pages.spec.ts", /public-pages\/\$\{theme\}\/\$\{pageCase\.slug\}\.png/, "snapshot path should group pages by theme");
  assertContains("e2e/public-pages.spec.ts", /getByRole\("heading"/, "spec should assert visible page headings before screenshots");
  assertContains("e2e/public-pages.spec.ts", /getByLabel/, "spec should assert key form controls before screenshots");

  assertContains("../docs/tasks.md", /\| T03 \| 已完成 \|[\s\S]*public-pages\.spec\.ts[\s\S]*登录、注册、找回、重置、404[\s\S]*4 个 viewport[\s\S]*亮\/暗主题截图/, "docs/tasks.md should record T03 completion");
}

try {
  main();
  console.log("Public page screenshot verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
