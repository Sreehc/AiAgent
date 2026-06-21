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
  assertContains("src/features/workspace/EvidencePanel.tsx", /export function EvidencePanel/, "EvidencePanel should be a dedicated workspace view");
  assertContains("src/features/workspace/EvidencePanel.tsx", /finalEvidenceSet/, "EvidencePanel should read final evidence from the latest run");
  assertContains("src/features/workspace/EvidencePanel.tsx", /recallSet/, "EvidencePanel should fall back to recall evidence");
  assertContains("src/features/workspace/EvidencePanel.tsx", /evidence-panel/, "EvidencePanel should expose a stable panel hook");
  assertContains("src/features/workspace/EvidencePanel.tsx", /evidence-card/, "Evidence items should use dedicated evidence cards");
  assertContains("src/features/workspace/EvidencePanel.tsx", /evidence-card__source/, "Evidence card should show source metadata");
  assertContains("src/features/workspace/EvidencePanel.tsx", /citationId/, "Evidence card should show citation id");
  assertContains("src/features/workspace/EvidencePanel.tsx", /sectionTitle/, "Evidence card should show section when present");
  assertContains("src/features/workspace/EvidencePanel.tsx", /contentPreview/, "Evidence card should show content preview");
  assertContains("src/features/workspace/EvidencePanel.tsx", /retrievalStrategy/, "Evidence card should show retrieval strategy");
  assertContains("src/features/workspace/EvidencePanel.tsx", /toFixed\(4\)/, "Evidence score should use stable tabular precision");

  assertContains("src/features/workspace/WorkspaceInspector.tsx", /import \{ EvidencePanel \} from "\.\/EvidencePanel"/, "Workspace inspector should import the dedicated EvidencePanel");
  assertContains("src/features/workspace/WorkspaceInspector.tsx", /<EvidencePanel selected=\{selected\} detail=\{detail\} \/>/, "Workspace inspector should mount EvidencePanel with current session detail");
  assertNotContains("src/features/workspace/WorkspaceInspector.tsx", /function EvidencePanel/, "Workspace inspector should not keep an inline evidence view");
  assertNotContains("src/features/workspace/WorkspaceInspector.tsx", /EvidenceItem/, "Workspace inspector should not own evidence data rendering types");

  assertContains("src/features/workspace/ArtifactPanel.tsx", /artifact-summary-grid/, "ArtifactPanel should expose summary grid for run/report/artifact hierarchy");
  assertContains("src/features/workspace/ArtifactPanel.tsx", /report-preview/, "ArtifactPanel should render a dedicated report preview");
  assertContains("src/features/workspace/ArtifactPanel.tsx", /artifact-card/, "ArtifactPanel should render artifacts as dedicated artifact cards");
  assertContains("src/features/workspace/ArtifactPanel.tsx", /artifact-card__actions/, "ArtifactPanel should keep open and reuse actions visible");
  assertContains("src/features/workspace/ArtifactPanel.tsx", /artifact\.resultUrl/, "ArtifactPanel should preserve open artifact link");
  assertContains("src/features/workspace/ArtifactPanel.tsx", /artifact\.reusable === false/, "ArtifactPanel should preserve reuse disabled state");
  assertNotContains("src/features/workspace/ArtifactPanel.tsx", /finalEvidenceSet/, "ArtifactPanel should not render evidence directly after W04");

  assertContains("src/styles/pages.css", /\.artifact-summary-grid\s*\{[\s\S]*display:\s*grid;/, "Artifact summary grid should have layout styles");
  assertContains("src/styles/pages.css", /\.report-preview\s*\{/, "Report preview should have a stable style");
  assertContains("src/styles/pages.css", /\.artifact-card\s*\{/, "Artifact card should have a stable style");
  assertContains("src/styles/pages.css", /\.artifact-card__actions\s*\{/, "Artifact card actions should have a stable style");
  assertContains("src/styles/pages.css", /\.evidence-panel\s*\{[\s\S]*display:\s*grid;/, "Evidence panel should have dedicated layout styles");
  assertContains("src/styles/pages.css", /\.evidence-card\s*\{/, "Evidence cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.evidence-card__source\s*\{/, "Evidence source metadata should have dedicated styles");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.artifact-summary-grid/, "Artifact and evidence layouts should adapt on mobile");

  assertContains("package.json", /"test:evidence-artifacts":\s*"node scripts\/verify-evidence-artifacts\.mjs"/, "package script should expose the W04 verifier");
}

try {
  main();
  console.log("Evidence and artifacts verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
