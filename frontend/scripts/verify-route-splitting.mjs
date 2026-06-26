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
  assertContains("src/router/AppRouter.tsx", /import \{ Suspense, lazy \} from "react";/, "AppRouter should use React lazy loading");
  assertContains("src/router/AppRouter.tsx", /const LoginPage = lazy\(\(\) => import\("\.\.\/pages\/LoginPage"\)[\s\S]*module\.LoginPage/, "Public pages should be lazy-loaded");
  assertContains("src/router/AppRouter.tsx", /const WorkspacePage = lazy\(\(\) => import\("\.\.\/pages\/WorkspacePage"\)[\s\S]*module\.WorkspacePage/, "Workspace page should be lazy-loaded");
  assertContains("src/router/AppRouter.tsx", /<Suspense fallback=\{null\}>/, "Routes should be wrapped in Suspense for async chunks");
  assertContains("vite.config.ts", /manualChunks\(id\)\s*\{/, "Vite config should declare manual chunk splitting");
  assertContains("vite.config.ts", /if \(id\.includes\("@radix-ui"\) \|\| id\.includes\("react"\) \|\| id\.includes\("react-dom"\) \|\| id\.includes\("react-router"\)\) return "framework";/, "Framework runtime should be grouped into a shared framework chunk");
  assertContains("vite.config.ts", /if \(id\.includes\("lucide-react"\)\) return "icons";/, "Icon library should be split into its own vendor chunk");
  assertContains("package.json", /"test:route-splitting":\s*"node scripts\/verify-route-splitting\.mjs"/, "Package scripts should expose route splitting verification");
}

try {
  main();
  console.log("Route splitting verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
