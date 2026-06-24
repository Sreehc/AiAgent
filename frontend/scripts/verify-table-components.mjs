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
  assertContains("src/components/ui/Table.tsx", /containerClassName\?:\s*string/, "Table should expose wrapper className for overflow/container styling");
  assertContains("src/components/ui/Table.tsx", /minWidth\?:\s*string \| number/, "Table should expose a minWidth to avoid unreadable mobile compression");
  assertContains("src/components/ui/Table.tsx", /className=\{cn\("table-scroll"/, "Table should use the shared horizontal scroll wrapper");
  assertContains("src/components/ui/Table.tsx", /minWidth:\s*typeof minWidth === "number" \? `\$\{minWidth\}px` : minWidth/, "Table should apply minWidth to the table element");
  assertContains("src/components/ui/Table.tsx", /density\?:\s*"default" \| "compact"/, "Table should support default and compact density");

  assertContains("src/components/ui/Table.tsx", /align\?:\s*TableAlign/, "TableHead/TableCell should support align semantics");
  assertContains("src/components/ui/Table.tsx", /numeric\?:\s*boolean/, "TableHead/TableCell should support numeric column semantics");
  assertContains("src/components/ui/Table.tsx", /status\?:\s*boolean/, "TableHead/TableCell should support compact status column semantics");
  assertContains("src/components/ui/Table.tsx", /numeric && "text-right font-mono tabular-nums"/, "Numeric cells should right-align and use mono tabular numbers");
  assertContains("src/components/ui/Table.tsx", /status && "w-px whitespace-nowrap"/, "Status cells should remain compact");
  assertNotContains("src/components/ui/Table.tsx", /uppercase/, "Table headers should not use all-caps styling");

  assertContains("src/components/ui/Table.tsx", /selected\?:\s*boolean/, "Table rows should support selected state");
  assertContains("src/components/ui/Table.tsx", /disabled\?:\s*boolean/, "Table rows should support disabled state");
  assertContains("src/components/ui/Table.tsx", /expanded\?:\s*boolean/, "Table rows should support expanded state");
  assertContains("src/components/ui/Table.tsx", /aria-selected=\{selected \|\| undefined\}/, "Selected rows should expose aria-selected");
  assertContains("src/components/ui/Table.tsx", /aria-disabled=\{disabled \|\| undefined\}/, "Disabled rows should expose aria-disabled");

  for (const name of ["TableLoading", "TableEmpty", "TableError", "TableExpandedRow"]) {
    assertContains("src/components/ui/Table.tsx", new RegExp(`export function ${name}`), `Table should export ${name}`);
    assertContains("src/components/ui/index.ts", new RegExp(name), `UI barrel should export ${name}`);
  }
  assertContains("src/components/ui/Table.tsx", /aria-busy="true"/, "TableLoading should expose busy state");
  assertContains("src/components/ui/Table.tsx", /role="status"/, "TableLoading should expose status semantics");
  assertContains("src/components/ui/Table.tsx", /role="alert"/, "TableError should expose alert semantics");
  assertContains("src/components/ui/Table.tsx", /surface-inset/, "Expanded rows should use inset surface styling");

  assertContains("src/styles/components.css", /\.table-scroll\s*\{[\s\S]*overflow-x:\s*auto;/, "Table wrapper should allow horizontal scrolling");
  assertContains("src/styles/components.css", /\.table-scroll\s*\{[\s\S]*background:\s*var\(--color-surface\);/, "Table wrapper should use the table surface");
  assertContains("src/styles/components.css", /\.table-state\s*\{[\s\S]*text-align:\s*center;/, "Table empty/error states should be centered and visible");
  assertContains("src/styles/components.css", /\.table-skeleton-bar\s*\{[\s\S]*animation:\s*skeleton-pulse/, "Table loading state should use skeleton rows");
}

try {
  main();
  console.log("Table component verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
