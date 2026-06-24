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
  assertContains("src/features/workspace/workspaceViewModel.ts", /export const AGENT_FEED_KIND_LABELS/, "View model should expose feed kind labels");
  assertContains("src/features/workspace/workspaceViewModel.ts", /run:\s*"Run"/, "Run feed label should be explicit");
  assertContains("src/features/workspace/workspaceViewModel.ts", /"plan-step":\s*"Plan step"/, "Plan step feed label should be explicit");
  assertContains("src/features/workspace/workspaceViewModel.ts", /tool:\s*"Tool"/, "Tool feed label should be explicit");
  assertContains("src/features/workspace/workspaceViewModel.ts", /artifact:\s*"Artifact"/, "Artifact feed label should be explicit");
  assertContains("src/features/workspace/workspaceViewModel.ts", /"stream-event":\s*"Live event"/, "Stream event feed label should be explicit");

  assertContains("src/features/workspace/ExecutionTimeline.tsx", /AgentFeedItem/, "Execution timeline should split rendering through AgentFeedItem");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /RunFeedItem/, "Run feed item should have a dedicated renderer");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /PlanStepFeedItem/, "Plan step feed item should have a dedicated renderer");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /ToolFeedItem/, "Tool feed item should have a dedicated renderer");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /ArtifactFeedItem/, "Artifact feed item should have a dedicated renderer");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /StreamEventFeedItem/, "Stream event feed item should have a dedicated renderer");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /title="Agent feed"/, "Panel title should name the Agent feed, not a debug timeline");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /className="agent-feed"/, "Feed list should use a dedicated class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /agent-feed-card--run/, "Run item should have a stable visual class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /agent-feed-card--plan-step/, "Plan step item should have a stable visual class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /agent-feed-card--tool/, "Tool item should have a stable visual class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /agent-feed-card--artifact/, "Artifact item should have a stable visual class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /agent-feed-card--stream-event/, "Stream event item should have a stable visual class");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /JsonBlock/, "Payload should remain folded through JsonBlock");
  assertNotContains("src/features/workspace/ExecutionTimeline.tsx", /className=\{`timeline-item/, "Agent feed should no longer use one generic timeline item renderer");

  assertContains("src/styles/pages.css", /\.agent-feed\s*\{[\s\S]*display:\s*grid;/, "Agent feed list should have dedicated layout styles");
  assertContains("src/styles/pages.css", /\.agent-feed-card\s*\{/, "Agent feed card should have a base style");
  assertContains("src/styles/pages.css", /\.agent-feed-card--run/, "Run feed visual treatment should be distinct");
  assertContains("src/styles/pages.css", /\.agent-feed-card--plan-step/, "Plan step feed visual treatment should be distinct");
  assertContains("src/styles/pages.css", /\.agent-feed-card--tool/, "Tool feed visual treatment should be distinct");
  assertContains("src/styles/pages.css", /\.agent-feed-card--artifact/, "Artifact feed visual treatment should be distinct");
  assertContains("src/styles/pages.css", /\.agent-feed-card--stream-event/, "Stream event feed visual treatment should be distinct");
  assertContains("src/styles/pages.css", /\.agent-feed-card__rail/, "Feed items should have a visual rail for scanning");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.agent-feed-card/, "Agent feed should adapt on mobile");

  assertContains("package.json", /"test:agent-feed-items":\s*"node scripts\/verify-agent-feed-items\.mjs"/, "package script should expose the W02 verifier");
}

try {
  main();
  console.log("Agent feed item verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
