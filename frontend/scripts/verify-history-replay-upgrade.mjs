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
  assertContains("src/pages/HistoryPage.tsx", /className="page page--history"/, "History page should expose a dedicated page modifier");
  assertContains("src/pages/HistoryPage.tsx", /const replayStats = useMemo/, "History page should derive replay header stats");
  assertContains("src/pages/HistoryPage.tsx", /className="history-replay-layout"/, "History page should use a history rail and replay detail layout");
  assertContains("src/pages/HistoryPage.tsx", /className="history-replay-layout__rail"/, "History page should expose the history rail");
  assertContains("src/pages/HistoryPage.tsx", /className="history-replay-layout__main"/, "History page should expose the replay detail region");
  assertContains("src/pages/HistoryPage.tsx", /replayDetailRef/, "History page should support scrolling replay detail into view on mobile selection");
  assertContains("src/pages/HistoryPage.tsx", /reusingArtifactId/, "History page should track artifact reuse feedback state");
  assertContains("src/pages/HistoryPage.tsx", /try\s*\{[\s\S]*localStorage\.setItem\(key, JSON\.stringify\(next\)\)[\s\S]*\}\s*catch/, "Artifact reuse should handle localStorage write failures");
  assertContains("src/pages/HistoryPage.tsx", /<ReplayDetail[\s\S]*reusingArtifactId=\{reusingArtifactId\}/, "ReplayDetail should receive artifact reuse loading state");
  assertNotContains("src/pages/HistoryPage.tsx", /<div className="content-grid">/, "History page should no longer rely on the generic content-grid layout");

  assertContains("src/features/history/HistoryFilters.tsx", /className="history-filters"/, "History filters should expose a dedicated style hook");
  assertContains("src/features/history/HistoryFilters.tsx", /loading\?:\s*boolean/, "History filters should accept loading state for refresh feedback");
  assertContains("src/features/history/HistoryFilters.tsx", /loading=\{loading\}/, "Refresh action should show loading feedback");
  assertContains("src/features/history/HistoryFilters.tsx", /value="TIMED_OUT"/, "Status filter should include timed-out sessions");
  assertContains("src/features/history/HistoryFilters.tsx", /value="CANCELLED"/, "Status filter should include cancelled sessions");

  assertContains("src/features/history/HistoryList.tsx", /className="history-session-panel"/, "History list panel should expose a dedicated style hook");
  assertContains("src/features/history/HistoryList.tsx", /className="history-session-list"/, "History sessions should render in a dedicated list");
  assertContains("src/features/history/HistoryList.tsx", /history-session-card/, "History sessions should render as dedicated cards");
  assertContains("src/features/history/HistoryList.tsx", /aria-pressed=\{selectedId === item\.sessionId\}/, "Selected session cards should expose pressed state");
  assertContains("src/features/history/HistoryList.tsx", /data-status=\{item\.status\.toLowerCase\(\)\}/, "Session cards should expose normalized status for styling");
  assertContains("src/features/history/HistoryList.tsx", /title=\{item\.sessionId\}/, "Long session IDs should expose full value");
  assertContains("src/features/history/HistoryList.tsx", /className="id-text truncate-id"/, "Long session IDs should use mono truncation");

  assertContains("src/features/history/ReplayDetail.tsx", /reusingArtifactId:\s*string \| null/, "ReplayDetail should accept artifact reuse loading state");
  assertContains("src/features/history/ReplayDetail.tsx", /className="replay-detail"/, "Replay detail should expose a dedicated root hook");
  assertContains("src/features/history/ReplayDetail.tsx", /className="replay-summary-grid"/, "Replay summary should use structured metric cards");
  assertContains("src/features/history/ReplayDetail.tsx", /className="replay-report-section"/, "Report should be separated from trace");
  assertContains("src/features/history/ReplayDetail.tsx", /className="replay-trace-section"/, "Trace should be separated from report and artifacts");
  assertContains("src/features/history/ReplayDetail.tsx", /<ExecutionTimeline items=\{traceItems\} \/>/, "Replay trace should use the shared Agent feed timeline");
  assertContains("src/features/history/ReplayDetail.tsx", /className="replay-artifact-list"/, "Artifacts should render in a dedicated reuse list");
  assertContains("src/features/history/ReplayDetail.tsx", /className="artifact-card replay-artifact-card"/, "Artifacts should use reusable artifact cards");
  assertContains("src/features/history/ReplayDetail.tsx", /loading=\{reusingArtifactId === artifact\.artifactId\}/, "Artifact reuse button should show loading feedback");
  assertContains("src/features/history/ReplayDetail.tsx", /disabled=\{artifact\.reusable === false \|\| reusingArtifactId !== null\}/, "Artifact reuse should disable unavailable or competing actions");
  assertContains("src/features/history/ReplayDetail.tsx", /className="id-text truncate-id"[\s\S]*title=\{latestRun\.runId\}/, "Long run IDs should use mono truncation with full title");
  assertContains("src/features/history/ReplayDetail.tsx", /failed && detail/, "Replay detail should preserve previous data when refresh fails");

  assertContains("src/styles/pages.css", /\.page--history/, "History page should have page-level styles");
  assertContains("src/styles/pages.css", /\.history-replay-layout\s*\{[\s\S]*grid-template-columns:\s*320px minmax\(0,\s*1fr\)/, "History layout should use a desktop rail/detail grid");
  assertContains("src/styles/pages.css", /\.history-replay-layout__rail\s*\{[\s\S]*position:\s*sticky;/, "History rail should stay anchored on desktop");
  assertContains("src/styles/pages.css", /\.history-session-card\s*\{/, "History session cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.history-session-card--active\s*\{/, "Active history session should be visually clear");
  assertContains("src/styles/pages.css", /\.replay-detail\s*\{[\s\S]*display:\s*grid;/, "Replay detail should have a dedicated stacked layout");
  assertContains("src/styles/pages.css", /\.replay-summary-grid\s*\{[\s\S]*display:\s*grid;/, "Replay summary should use a metric grid");
  assertContains("src/styles/pages.css", /\.replay-report-body\s*\{/, "Replay report should have dedicated body styles");
  assertContains("src/styles/pages.css", /\.replay-artifact-card__actions\s*\{[\s\S]*min-height:\s*44px;/, "Artifact reuse actions should preserve mobile touch target size");
  assertContains("src/styles/pages.css", /@media \(max-width: 1100px\)[\s\S]*\.history-replay-layout\s*\{[\s\S]*grid-template-columns:\s*1fr;/, "History layout should collapse to one column on smaller screens");

  assertContains("package.json", /"test:history-replay-upgrade":\s*"node scripts\/verify-history-replay-upgrade\.mjs"/, "package script should expose the H01 verifier");
}

try {
  main();
  console.log("History replay upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
