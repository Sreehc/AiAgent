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
  assertContains("src/components/ui/Tabs.tsx", /variant\?:\s*"segmented" \| "underline"/, "Tabs should support segmented and underline variants");
  assertContains("src/components/ui/Tabs.tsx", /disabled\?:\s*boolean/, "Tab items should support disabled state");
  assertContains("src/components/ui/Tabs.tsx", /className=\{cn\("tabs-scroll"/, "Tabs should use a horizontal overflow wrapper");
  assertContains("src/components/ui/Tabs.tsx", /className=\{cn\(tabsListVariants/, "Tabs list should centralize variant styling");
  assertContains("src/components/ui/Tabs.tsx", /className=\{cn\(tabsTriggerVariants/, "Tabs triggers should centralize variant styling");
  assertContains("src/components/ui/Tabs.tsx", /data-\[state=active\]:after:opacity-100/, "Active tabs should use a visible indicator, not only background");
  assertContains("src/components/ui/Tabs.tsx", /focus-visible:ring-2/, "Tabs triggers should expose visible keyboard focus");
  assertContains("src/components/ui/Tabs.tsx", /disabled=\{item\.disabled\}/, "Tabs triggers should pass disabled to Radix");
  assertContains("src/components/ui/Tabs.tsx", /data-\[disabled\]:cursor-not-allowed/, "Disabled tabs should remain readable and visibly disabled");
  assertContains("src/components/ui/Tabs.tsx", /whitespace-nowrap/, "Tabs should not wrap and compress on small screens");

  for (const name of ["TabsContent", "TabsContentState"]) {
    assertContains("src/components/ui/Tabs.tsx", new RegExp(`export function ${name}`), `Tabs should export ${name}`);
    assertContains("src/components/ui/index.ts", new RegExp(name), `UI barrel should export ${name}`);
  }
  assertContains("src/components/ui/Tabs.tsx", /state\?:\s*"default" \| "loading" \| "empty" \| "error"/, "Tabs content should support loading/empty/error states");
  assertContains("src/components/ui/Tabs.tsx", /aria-busy=\{state === "loading" \|\| undefined\}/, "Tabs content loading state should expose aria-busy");
  assertContains("src/components/ui/Tabs.tsx", /role=\{state === "error" \? "alert" : undefined\}/, "Tabs content error state should expose alert semantics");
  assertContains("src/components/ui/Tabs.tsx", /data-state=\{state\}/, "Tabs content should expose state for styling and tests");

  assertContains("src/styles/components.css", /\.tabs-scroll\s*\{[\s\S]*overflow-x:\s*auto;/, "Tabs wrapper should allow horizontal overflow");
  assertContains("src/styles/components.css", /\.tabs-scroll\s*\{[\s\S]*scrollbar-width:\s*thin;/, "Tabs overflow should remain usable without visual clutter");
  assertContains("src/styles/components.css", /\.tabs-content-state\s*\{[\s\S]*min-height:\s*96px;/, "Tabs content states should be visible and not blank");
  assertContains("src/styles/components.css", /\.tabs-content-state--error\s*\{[\s\S]*color:\s*var\(--color-danger\);/, "Tabs error content should use danger text");
}

try {
  main();
  console.log("Tabs component verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
