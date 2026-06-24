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
  assertContains("src/components/ui/index.ts", /export \{ AppBrandMark \} from "\.\/AppBrandMark";/, "UI exports should expose the shared brand mark");
  assertContains("src/components/shell/Sidebar.tsx", /<AppBrandMark className="app-brand__mark" \/>/, "Sidebar should render the shared brand mark");
  assertContains("src/features/auth/AuthLayout.tsx", /<AppBrandMark className="app-brand__mark" \/>/, "Auth layout should render the shared brand mark");
  assertContains("index.html", /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/, "Frontend should register the SVG favicon");
  assertContains("index.html", /<link rel="apple-touch-icon" href="\/apple-touch-icon\.svg" \/>/, "Frontend should register an apple touch icon");
  assertContains("index.html", /<link rel="mask-icon" href="\/mask-icon\.svg" color="#0891b2" \/>/, "Frontend should register a Safari mask icon");
  assertContains("index.html", /<link rel="manifest" href="\/manifest\.webmanifest" \/>/, "Frontend should register the web manifest");
  assertContains("src/features/auth/AuthLayout.tsx", /<span className="auth-brand__lockup">/, "Auth layout should render a dedicated brand lockup");
  assertContains("package.json", /"test:brand-icon-upgrade":\s*"node scripts\/verify-brand-icon-upgrade\.mjs"/, "Package scripts should expose the brand icon verifier");
}

try {
  main();
  console.log("Brand icon upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
