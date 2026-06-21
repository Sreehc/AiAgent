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
  assertContains("src/features/workspace/ToolInvocationList.tsx", /tool-call-list/, "Tool invocation list should use a dedicated list layout");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /tool-call-card/, "Each tool invocation should use a dedicated card layout");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /tool-call-card__summary/, "Tool invocation should expose a visible summary area");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /tool-call-card__details/, "Request and response details should be grouped separately");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /formatDuration/, "Tool invocation should compute and show duration");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /summarizeToolPayload/, "Tool invocation should compute request and response summaries");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /label="请求 payload"/, "Request payload should be shown in its own folded JsonBlock");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /label="响应 payload"/, "Response payload should be shown in its own folded JsonBlock");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /summary=\{requestSummary\}/, "Request JsonBlock should receive a summary");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /summary=\{responseSummary\}/, "Response JsonBlock should receive a summary");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /previewPayload\(item\.requestPayload\)/, "Request payload should be previewed independently");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /previewPayload\(item\.responsePayload\)/, "Response payload should be previewed independently");
  assertContains("src/features/workspace/ToolInvocationList.tsx", /className="tabular-nums"/, "Duration and counts should use tabular numbers");
  assertNotContains("src/features/workspace/ToolInvocationList.tsx", /responsePayload \?\? item\.requestPayload/, "Request and response payloads should not be merged into a single detail block");
  assertNotContains("src/features/workspace/ToolInvocationList.tsx", /className="timeline-item"/, "Tool invocation list should no longer use generic timeline item cards");

  assertContains("src/styles/pages.css", /\.tool-call-list\s*\{[\s\S]*display:\s*grid;/, "Tool call list should have a dedicated grid layout");
  assertContains("src/styles/pages.css", /\.tool-call-card\s*\{/, "Tool call card should have a base style");
  assertContains("src/styles/pages.css", /\.tool-call-card__summary\s*\{/, "Tool call summary should be styled");
  assertContains("src/styles/pages.css", /\.tool-call-card__details\s*\{[\s\S]*display:\s*grid;/, "Tool call details should have a stable grid layout");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.tool-call-card__header/, "Tool call cards should adapt on mobile");

  assertContains("package.json", /"test:tool-invocation-summary":\s*"node scripts\/verify-tool-invocation-summary\.mjs"/, "package script should expose the W03 verifier");
}

try {
  main();
  console.log("Tool invocation summary verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
