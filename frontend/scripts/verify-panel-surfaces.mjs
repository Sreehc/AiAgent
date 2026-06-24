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
  assertContains("src/components/ui/Panel.tsx", /variant:\s*\{[\s\S]*default:\s*"[^"]*bg-card[^"]*shadow-none/, "Panel default variant should use a quiet surface without shadow");
  assertContains("src/components/ui/Panel.tsx", /plain:\s*"[^"]*bg-transparent/, "Panel should support plain layout containers");
  assertContains("src/components/ui/Panel.tsx", /subtle:\s*"[^"]*bg-muted\/40/, "Panel should support subtle grouping surfaces");
  assertContains("src/components/ui/Panel.tsx", /raised:\s*"[^"]*bg-popover[^"]*shadow-md/, "Panel raised variant should be reserved for higher layers");
  assertContains("src/components/ui/Panel.tsx", /empty:\s*"[^"]*border-dashed/, "Panel should support empty state containers");
  assertNotContains("src/components/ui/Panel.tsx", /default:\s*"[^"]*shadow-sm/, "Panel default should not use default shadow");

  assertContains("src/components/ui/Panel.tsx", /state\?:\s*"default" \| "loading" \| "empty" \| "error"/, "Panel should expose explicit loading, empty and error state semantics");
  assertContains("src/components/ui/Panel.tsx", /aria-busy=\{state === "loading" \|\| undefined\}/, "Panel loading state should expose aria-busy");
  assertContains("src/components/ui/Panel.tsx", /role=\{state === "error" \? "alert" : undefined\}/, "Panel error state should expose alert semantics");
  assertContains("src/components/ui/Panel.tsx", /data-state=\{state\}/, "Panel should expose data-state for styling and tests");
  assertContains("src/components/ui/Panel.tsx", /panelHeaderVariants/, "Panel should centralize header variants");
  assertContains("src/components/ui/Panel.tsx", /panelBodyVariants/, "Panel should centralize body variants");
  assertContains("src/components/ui/Panel.tsx", /panelFooterVariants/, "Panel should centralize footer variants");

  const componentCss = readProjectFile("src/styles/components.css");
  for (const className of [".surface", ".surface-subtle", ".surface-inset", ".surface-raised"]) {
    if (!componentCss.includes(className)) {
      throw new Error(`src/styles/components.css: missing ${className} utility`);
    }
  }
  assertContains("src/styles/components.css", /\.surface\s*\{[\s\S]*box-shadow:\s*none;/, "Default surface should not use shadow");
  assertContains("src/styles/components.css", /\.surface-raised\s*\{[\s\S]*box-shadow:\s*var\(--shadow-md\);/, "Raised surface should use the md overlay shadow");
  assertContains("src/styles/components.css", /\.panel-action-wrap\s*\{[\s\S]*flex-wrap:\s*wrap;/, "Panel actions should wrap on narrow screens");
}

try {
  main();
  console.log("Panel surface verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
