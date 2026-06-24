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
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /type InspectorTab = "artifacts" \| "evidence" \| "memory" \| "tools"/, "Inspector should define the four supported tab ids as a union");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /const INSPECTOR_TABS[\s\S]*id:\s*"artifacts"[\s\S]*id:\s*"evidence"[\s\S]*id:\s*"memory"[\s\S]*id:\s*"tools"/, "Inspector should keep tab metadata in one ordered list");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /useState<InspectorTab>\("artifacts"\)/, "Inspector should control the active tab state");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<RadixTabs\.Root[\s\S]*value=\{activeTab\}[\s\S]*onValueChange=\{\(value\) => setActiveTab\(value as InspectorTab\)\}/, "Inspector tabs should be controlled, not default-only");
  assertNotContains("src/features/workspace/WorkspaceInspector.tsx", /defaultValue="artifacts"/, "Inspector should not rely on a default-only tab value");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /INSPECTOR_TABS\.map/, "Inspector should render triggers from tab metadata");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /forceMount/, "Inspector should force-mount tab panels so panel state stays stable");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /TabsContentState/, "Inspector should use shared TabsContentState for tab panel states");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /function getInspectorContentState/, "Inspector should centralize loading, empty and error state mapping");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /loading\?:\s*boolean/, "Inspector should accept a loading prop");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /error\?:\s*string \| null/, "Inspector should accept an error prop");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<Skeleton[\s\S]*variant="card"/, "Inspector loading state should render a shared Skeleton");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<Alert[\s\S]*tone="error"/, "Inspector error state should render a shared Alert");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /EMPTY_COPY/, "Inspector empty states should have tab-specific copy");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<EmptyState[\s\S]*title=\{EMPTY_COPY\[tab\]\.title\}/, "Inspector empty state should use shared EmptyState with tab-specific title");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /hidden=\{activeTab !== tab\}/, "Force-mounted inactive panels should be hidden from layout");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /data-inspector-tab=\{tab\}/, "Each tab content should expose a stable test hook");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<ArtifactPanel/, "Artifact panel should remain mounted in the artifacts tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<EvidencePanel/, "Evidence panel should remain mounted in the evidence tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<MemoryPanel/, "Memory panel should remain mounted in the memory tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<ToolInvocationList/, "Tool invocation panel should remain mounted in the tools tab");

  assertContains("src/pages/WorkspacePage.tsx", /loadingSessionDetail/, "Workspace page should track session detail loading separately from session list loading");
  assertContains("src/pages/WorkspacePage.tsx", /sessionDetailError/, "Workspace page should track inspector-specific detail errors");
  assertContains("src/pages/WorkspacePage.tsx", /setLoadingSessionDetail\(true\)/, "Session detail loading should start before fetching detail");
  assertContains("src/pages/WorkspacePage.tsx", /setLoadingSessionDetail\(false\)/, "Session detail loading should stop after fetching detail");
  assertContains("src/pages/WorkspacePage.tsx", /loading=\{loadingSessionDetail\}/, "Workspace page should pass detail loading to the inspector");
  assertContains("src/pages/WorkspacePage.tsx", /error=\{sessionDetailError\}/, "Workspace page should pass detail errors to the inspector");

  assertContains("package.json", /"test:workspace-inspector-tabs":\s*"node scripts\/verify-workspace-inspector-tabs\.mjs"/, "package script should expose the W05 verifier");
}

try {
  main();
  console.log("Workspace inspector tabs verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
