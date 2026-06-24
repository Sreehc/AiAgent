import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function extractRule(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  if (!match) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }
  return match[1];
}

function assertRuleIncludes(css, selector, expectedSnippets) {
  const block = extractRule(css, selector);
  for (const snippet of expectedSnippets) {
    if (!block.includes(snippet)) {
      throw new Error(`${selector} is missing "${snippet}"`);
    }
  }
}

function assertContains(filePath, pattern, message) {
  const content = readProjectFile(filePath);
  if (!pattern.test(content)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function main() {
  const baseCss = readProjectFile("src/styles/base.css");

  assertRuleIncludes(baseCss, ".tabular-nums", [
    "font-variant-numeric: tabular-nums",
    "font-feature-settings: \"tnum\""
  ]);
  assertRuleIncludes(baseCss, ".numeric", [
    "font-family: var(--font-mono)",
    "font-variant-numeric: tabular-nums"
  ]);
  assertRuleIncludes(baseCss, ".id-text", [
    "font-family: var(--font-mono)",
    "font-variant-numeric: tabular-nums"
  ]);
  assertRuleIncludes(baseCss, ".truncate-id", [
    "overflow: hidden",
    "text-overflow: ellipsis",
    "white-space: nowrap"
  ]);

  const componentChecks = [
    {
      file: "src/features/knowledge/DocumentVersionsPanel.tsx",
      checks: [
        [/className="[^"]*numeric[^"]*"/, "version/file-size metadata should use numeric styling"],
        [/title=\{item\.documentId\}/, "document IDs should expose the full value"],
        [/truncate-id/, "document IDs should truncate by default"]
      ]
    },
    {
      file: "src/features/knowledge/DocumentTable.tsx",
      checks: [
        [/className="[^"]*tabular-nums[^"]*"/, "document count badge should use tabular numbers"],
        [/className="[^"]*numeric[^"]*"/, "document metadata should use numeric styling"]
      ]
    },
    {
      file: "src/features/workspace/ArtifactPanel.tsx",
      checks: [
        [/title=\{latestRun\.runId\}/, "run IDs should expose the full value"],
        [/truncate-id/, "run and citation IDs should truncate by default"],
        [/className="[^"]*tabular-nums[^"]*"/, "artifact counts and evidence scores should use tabular numbers"]
      ]
    },
    {
      file: "src/features/knowledge/SearchTestPanel.tsx",
      checks: [
        [/title=\{hit\.citationId\}/, "citation IDs should expose the full value"],
        [/truncate-id/, "citation/document IDs should truncate by default"],
        [/className="[^"]*tabular-nums[^"]*"/, "hit counts, ranks and scores should use tabular numbers"]
      ]
    },
    {
      file: "src/features/workspace/MemoryPanel.tsx",
      checks: [
        [/className="[^"]*tabular-nums[^"]*"/, "token count badge should use tabular numbers"]
      ]
    },
    {
      file: "src/features/workspace/ResearchComposer.tsx",
      checks: [
        [/title=\{artifact\.artifactId\}/, "artifact IDs should expose the full value"],
        [/truncate-id/, "artifact IDs should truncate by default"],
        [/className="[^"]*tabular-nums[^"]*"/, "selected artifact count should use tabular numbers"]
      ]
    }
  ];

  for (const { file, checks } of componentChecks) {
    for (const [pattern, message] of checks) {
      assertContains(file, pattern, message);
    }
  }
}

try {
  main();
  console.log("Typography rule verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
