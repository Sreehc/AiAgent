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
  assertContains("src/pages/NotFoundPage.tsx", /AuthLayout/, "404 page should keep the shared AuthLayout brand background");
  assertContains("src/pages/NotFoundPage.tsx", /useAuthSession/, "404 page should read auth session state");
  assertContains("src/pages/NotFoundPage.tsx", /const\s+\{\s*session\s*\}\s*=\s*useAuthSession\(\)/, "404 page should derive its CTA from the current session");
  assertContains("src/pages/NotFoundPage.tsx", /session\s*\?\s*"\/workspace\/chat"\s*:\s*"\/login"/, "logged-in users should have a workspace primary target and guests should have login");
  assertContains("src/pages/NotFoundPage.tsx", /session\s*\?\s*"返回研究工作台"\s*:\s*"返回登录"/, "primary CTA label should change with session state");
  assertContains("src/pages/NotFoundPage.tsx", /session\s*\?\s*"\/login"\s*:\s*"\/workspace\/chat"/, "404 page should keep the alternate destination visible as a secondary path");
  assertContains("src/pages/NotFoundPage.tsx", /Button/, "404 page should use the shared Button component");
  assertContains("src/pages/NotFoundPage.tsx", /not-found-actions/, "404 page should expose a stable action layout hook");
  assertContains("src/pages/NotFoundPage.tsx", /not-found-code/, "404 page should expose a stable 404 code styling hook");
  assertContains("src/pages/NotFoundPage.tsx", /not-found-panel/, "404 page should expose a stable panel styling hook");
  assertNotContains("src/pages/NotFoundPage.tsx", /className="btn\b/, "404 page should not use legacy raw btn classes");

  assertContains("src/styles/pages.css", /\.not-found-panel\s*\{/, "404 page should have a dedicated compact panel style");
  assertContains("src/styles/pages.css", /\.not-found-code\s*\{/, "404 code should have dedicated responsive styling");
  assertContains("src/styles/pages.css", /\.not-found-actions\s*\{[\s\S]*display:\s*grid;/, "404 actions should use a stable grid layout");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.not-found-actions/, "404 actions should adapt for mobile");

  assertContains("package.json", /"test:not-found-page":\s*"node scripts\/verify-not-found-page\.mjs"/, "package script should expose the S03 verifier");
}

try {
  main();
  console.log("Not found page verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
