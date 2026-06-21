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
  assertContains("src/components/shell/navigation.ts", /export type NavigationSection/, "Navigation should expose typed sections for shell rendering");
  assertContains("src/components/shell/navigation.ts", /navigationSections/, "Navigation should centralize shell groups");
  assertContains("src/components/shell/navigation.ts", /adminOnly:\s*true/, "Admin navigation section should remain permission-gated");
  assertContains("src/components/shell/navigation.ts", /getNavigationSections\(isAdmin:\s*boolean\)/, "Navigation should filter admin groups from a single helper");
  assertContains("src/components/shell/navigation.ts", /findNavigationItem/, "Topbar should be able to resolve the current page");
  assertContains("src/components/shell/navigation.ts", /findNavigationSection/, "Topbar should be able to resolve the current section");

  assertContains("src/components/shell/AppShell.tsx", /const isAdmin = session\?\.user\.roles\.includes\("ADMIN"\) \?\? false/, "AppShell should compute admin once and pass it through");
  assertContains("src/components/shell/AppShell.tsx", /data-sidebar-state=\{sidebarCollapsed \? "collapsed" : "expanded"\}/, "AppShell should expose sidebar state for stable styling");
  assertContains("src/components/shell/AppShell.tsx", /id="app-sidebar"/, "Sidebar should have a stable id for the mobile menu trigger");
  assertContains("src/components/shell/AppShell.tsx", /menuOpen=\{sidebarOpen\}/, "Topbar should know whether the mobile menu is open");
  assertContains("src/components/shell/AppShell.tsx", /isAdmin=\{isAdmin\}/, "Topbar and Sidebar should preserve admin-aware rendering");

  assertContains("src/components/shell/Sidebar.tsx", /getNavigationSections\(isAdmin\)/, "Sidebar should render navigation from permission-filtered sections");
  assertContains("src/components/shell/Sidebar.tsx", /data-admin-only=\{section\.adminOnly \|\| undefined\}/, "Admin section should remain identifiable and gated");
  assertContains("src/components/shell/Sidebar.tsx", /className=\{\(\{ isActive \}\) => cn\("app-nav__link"/, "NavLink should use active state explicitly");
  assertContains("src/components/shell/Sidebar.tsx", /app-nav__link--active/, "Active nav should have a dedicated class");
  assertContains("src/components/shell/Sidebar.tsx", /aria-label=\{collapsed \? item\.label : undefined\}/, "Collapsed navigation should keep accessible labels");
  assertContains("src/components/shell/Sidebar.tsx", /aria-label=\{section\.label\}/, "Navigation groups should be labelled");

  assertContains("src/components/shell/Topbar.tsx", /menuOpen:\s*boolean/, "Topbar should receive mobile menu state");
  assertContains("src/components/shell/Topbar.tsx", /aria-controls="app-sidebar"/, "Mobile menu button should target the sidebar");
  assertContains("src/components/shell/Topbar.tsx", /aria-expanded=\{menuOpen\}/, "Mobile menu button should expose expanded state");
  assertContains("src/components/shell/Topbar.tsx", /findNavigationItem\(location\.pathname\)/, "Topbar should resolve the current page from navigation helpers");
  assertContains("src/components/shell/Topbar.tsx", /findNavigationSection\(location\.pathname,\s*isAdmin\)/, "Topbar should resolve the current section with admin context");
  assertContains("src/components/shell/Topbar.tsx", /Search/, "Command trigger should use a search icon");
  assertContains("src/components/shell/Topbar.tsx", /Menu/, "Mobile menu button should use a menu icon");

  assertContains("src/components/shell/MobileNav.tsx", /useEffect/, "Mobile backdrop should handle Escape to close");
  assertContains("src/components/shell/MobileNav.tsx", /event\.key === "Escape"/, "Mobile menu should close on Escape");
  assertContains("src/components/shell/MobileNav.tsx", /aria-label="关闭主导航"/, "Mobile backdrop should remain accessible");

  assertContains("src/styles/layout.css", /\.app-nav__link--active/, "Layout CSS should style active navigation explicitly");
  assertContains("src/styles/layout.css", /\.app-nav__section-heading/, "Sidebar sections should have a styled heading");
  assertContains("src/styles/layout.css", /\.topbar__context/, "Topbar should have a current context region");
  assertContains("src/styles/layout.css", /\.topbar__role/, "Topbar role display should be styled independently");
  assertContains("src/styles/layout.css", /\.command-trigger:hover/, "Command trigger should have hover feedback");
  assertContains("src/styles/layout.css", /\.mobile-menu-button/, "Mobile menu trigger should remain responsive");

  assertContains("package.json", /"test:shell-navigation":\s*"node scripts\/verify-shell-navigation\.mjs"/, "package script should expose the S01 verifier");
}

try {
  main();
  console.log("Shell navigation verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
