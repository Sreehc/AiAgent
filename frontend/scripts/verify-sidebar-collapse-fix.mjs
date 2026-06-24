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
  assertContains("src/components/shell/Sidebar.tsx", /collapsed \? <Tooltip key=\{item\.to\} content=\{item\.label\} side="right">\{link\}<\/Tooltip> : link/, "Collapsed sidebar items should still use tooltips");
  assertContains("src/components/shell/Sidebar.tsx", /collapsed \? null : <>\s*<span>\{item\.label\}<\/span>\s*<small>\{item\.shortLabel\}<\/small>\s*<\/>/, "Collapsed sidebar should stop rendering nav text content");
  assertContains("src/components/shell/Sidebar.tsx", /aria-label=\{collapsed \? item\.label : undefined\}/, "Collapsed sidebar links should preserve accessible labels");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \{\s*grid-template-columns:\s*72px minmax\(0, 1fr\);/, "Collapsed sidebar rail should stay compact and intentional");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \.app-sidebar \{\s*align-items:\s*center;\s*gap:\s*var\(--space-4\);\s*padding-inline:\s*10px;/, "Collapsed sidebar should use tight but balanced rail spacing");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \.app-sidebar__header \{\s*justify-content:\s*center;\s*flex-direction:\s*column;/, "Collapsed sidebar header should stack logo and toggle cleanly");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \.app-brand__mark \{\s*width:\s*34px;\s*height:\s*34px;/, "Collapsed sidebar brand mark should scale down for the rail");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \.app-nav__link \{\s*width:\s*44px;\s*min-height:\s*44px;/, "Collapsed sidebar links should use compact icon buttons");
  assertContains("src/styles/layout.css", /\.app-shell\.sidebar-collapsed \.app-nav__icon \{\s*width:\s*20px;\s*height:\s*20px;/, "Collapsed sidebar icons should stay crisp without overpowering the rail");
  assertContains("package.json", /"test:sidebar-collapse-fix":\s*"node scripts\/verify-sidebar-collapse-fix\.mjs"/, "package script should expose the sidebar collapse verifier");
}

try {
  main();
  console.log("Sidebar collapse verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
