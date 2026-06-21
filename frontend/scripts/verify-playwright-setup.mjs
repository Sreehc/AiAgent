import { existsSync, readFileSync } from "node:fs";
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

function assertExists(path, message) {
  if (!existsSync(resolve(rootDir, path))) {
    throw new Error(`${path}: ${message}`);
  }
}

function main() {
  assertContains("package.json", /"@playwright\/test":\s*"/, "Playwright test runner should be installed as a dev dependency");
  assertContains("package.json", /"e2e":\s*"playwright test"/, "package script should expose Playwright e2e tests");
  assertContains("package.json", /"e2e:headed":\s*"playwright test --headed"/, "package script should expose headed Playwright runs");
  assertContains("package.json", /"test:playwright-setup":\s*"node scripts\/verify-playwright-setup\.mjs"/, "package script should expose the T01 verifier");

  assertExists("playwright.config.ts", "Playwright config should exist");
  assertContains("playwright.config.ts", /defineConfig/, "Playwright config should use defineConfig");
  assertContains("playwright.config.ts", /testDir:\s*["']\.\/e2e["']/, "Playwright should use frontend/e2e as testDir");
  assertContains("playwright.config.ts", /const baseURL = process\.env\.PLAYWRIGHT_BASE_URL \?\? ["']http:\/\/127\.0\.0\.1:4173["']/, "Playwright should default to local preview baseURL");
  assertContains("playwright.config.ts", /use:\s*\{[\s\S]*baseURL,/, "Playwright should apply the configured baseURL");
  assertContains("playwright.config.ts", /webServer:\s*\{[\s\S]*command:\s*["']pnpm build && pnpm preview --host 127\.0\.0\.1["'][\s\S]*url:\s*baseURL/, "Playwright should build and manage a local preview server");
  assertContains("playwright.config.ts", /reuseExistingServer:\s*!process\.env\.CI/, "Local runs should reuse an existing server");
  assertContains("playwright.config.ts", /reporter:\s*\[\s*\["html"/, "Playwright should configure an HTML report");
  assertContains("playwright.config.ts", /trace:\s*["']on-first-retry["']/, "Playwright should collect traces on retry");
  assertContains("playwright.config.ts", /channel:\s*["']chrome["']/, "Playwright should use the installed Chrome channel to avoid browser binary bootstrap");
  assertContains("playwright.config.ts", /workers:\s*2/, "Playwright should limit workers to keep system Chrome screenshot runs stable");
  assertContains("playwright.config.ts", /name:\s*["']chromium-desktop["'][\s\S]*width:\s*1440[\s\S]*height:\s*900/, "Desktop viewport project should be configured");
  assertContains("playwright.config.ts", /name:\s*["']chromium-laptop["'][\s\S]*width:\s*1280[\s\S]*height:\s*800/, "Laptop viewport project should be configured");
  assertContains("playwright.config.ts", /name:\s*["']chromium-tablet["'][\s\S]*width:\s*768[\s\S]*height:\s*1024/, "Tablet viewport project should be configured");
  assertContains("playwright.config.ts", /name:\s*["']chromium-mobile["'][\s\S]*width:\s*390[\s\S]*height:\s*844/, "Mobile viewport project should be configured");

  assertExists("e2e/smoke.spec.ts", "A minimal smoke test should exist");
  assertContains("e2e/smoke.spec.ts", /test\(["']renders the public login experience["']/, "Smoke test should verify the public login route");
  assertContains("e2e/smoke.spec.ts", /page\.goto\(["']\/login["']\)/, "Smoke test should navigate through baseURL");
  assertContains("e2e/smoke.spec.ts", /getByRole\(["']heading["'],\s*\{\s*name:\s*\/登录工作台\//, "Smoke test should assert visible login content");
  assertContains("e2e/smoke.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']进入工作台["']\s*\}/, "Smoke test should assert the login submit button");

  assertContains("../docs/tasks.md", /\| T01 \| 已完成 \|[\s\S]*Playwright config[\s\S]*可运行 Playwright[\s\S]*不依赖真实生产数据/, "docs/tasks.md should record T01 completion");
}

try {
  main();
  console.log("Playwright setup verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
