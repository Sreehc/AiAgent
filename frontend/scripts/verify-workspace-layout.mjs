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
  assertContains("src/pages/WorkspacePage.tsx", /WorkspaceInspector/, "Workspace should delegate the right rail to a dedicated inspector component");
  assertContains("src/pages/WorkspacePage.tsx", /className="page page--workspace"/, "Workspace page should expose a dedicated page modifier");
  assertContains("src/pages/WorkspacePage.tsx", /className="workspace-shell"/, "Workspace should use the new three-zone shell");
  assertContains("src/pages/WorkspacePage.tsx", /className="workspace-session-rail"/, "Workspace should have an explicit session rail");
  assertContains("src/pages/WorkspacePage.tsx", /className="workspace-main-flow"/, "Workspace should have an explicit main research flow column");
  assertContains("src/pages/WorkspacePage.tsx", /className="workspace-inspector"/, "Workspace should have an explicit inspector region");
  assertContains("src/pages/WorkspacePage.tsx", /onCreate=\{onCreateSession\}/, "Session creation handler should remain wired");
  assertContains("src/pages/WorkspacePage.tsx", /onSelect=\{setSelectedSessionId\}/, "Session selection handler should remain wired");
  assertContains("src/pages/WorkspacePage.tsx", /onDelete=\{setSessionToDelete\}/, "Session deletion handler should remain wired");
  assertNotContains("src/pages/WorkspacePage.tsx", /className="workspace-grid"/, "Workspace should no longer use the old workspace-grid layout");

  assertContains("src/features/workspace/WorkspaceInspector.tsx", /@radix-ui\/react-tabs/, "Workspace inspector should use Radix tabs for keyboard-accessible content");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /aria-label="工作台 Inspector"/, "Workspace inspector should be labelled for assistive technology");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /id:\s*"artifacts"[\s\S]*label:\s*"产物"/, "Inspector should expose an artifacts tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /id:\s*"evidence"[\s\S]*label:\s*"证据"/, "Inspector should expose an evidence tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /id:\s*"memory"[\s\S]*label:\s*"记忆"/, "Inspector should expose a memory tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /id:\s*"tools"[\s\S]*label:\s*"工具"/, "Inspector should expose a tools tab");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<ArtifactPanel/, "Existing artifact behavior should remain mounted inside the inspector");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<EvidencePanel selected=\{selected\} detail=\{detail\} \/>/, "Existing evidence behavior should remain mounted inside the inspector");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<MemoryPanel/, "Existing memory behavior should remain mounted inside the inspector");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<ToolInvocationList/, "Existing tool invocation behavior should remain mounted inside the inspector");
  assertContains("src/features/workspace/EvidencePanel.tsx", /finalEvidenceSet/, "Evidence tab should derive from existing run evidence data");

  assertContains("src/styles/layout.css", /\.workspace-shell\s*\{[\s\S]*grid-template-columns:\s*var\(--workspace-session-width\) minmax\(0,\s*1fr\) var\(--workspace-inspector-width\);/, "Desktop workspace should use tokenized three-column layout");
  assertContains("src/styles/layout.css", /\.workspace-session-rail\s*\{[\s\S]*position:\s*sticky;/, "Session rail should stay anchored on desktop");
  assertContains("src/styles/layout.css", /\.workspace-inspector\s*\{[\s\S]*position:\s*sticky;/, "Inspector should stay anchored on desktop");
  assertContains("src/styles/layout.css", /@media \(max-width: 1199px\)[\s\S]*\.workspace-shell\s*\{[\s\S]*grid-template-columns:\s*var\(--workspace-session-width\) minmax\(0,\s*1fr\);[\s\S]*\.workspace-inspector\s*\{[\s\S]*grid-column:\s*1 \/ -1;/, "Below 1200px inspector should move below the main grid");
  assertContains("src/styles/layout.css", /@media \(max-width: 900px\)[\s\S]*\.workspace-shell\s*\{[\s\S]*grid-template-columns:\s*1fr;/, "Mobile workspace should become single-column");
  assertContains("src/styles/layout.css", /\.workspace-inspector__tabs/, "Inspector tabs should have dedicated styling");
  assertContains("src/styles/layout.css", /\.workspace-evidence-list/, "Evidence tab should have a stable list layout");

  assertContains("package.json", /"test:workspace-layout":\s*"node scripts\/verify-workspace-layout\.mjs"/, "package script should expose the W01 verifier");
}

try {
  main();
  console.log("Workspace layout verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
