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
  assertContains("src/features/workspace/ResearchComposer.tsx", /type RunControlStatus =[\s\S]*"CANCEL_REQUESTED"[\s\S]*"TIMED_OUT"/, "ResearchComposer should model explicit run statuses including cancellation and timeout");
  assertContains("src/features/workspace/ResearchComposer.tsx", /const RUN_STATUS_COPY[\s\S]*RUNNING[\s\S]*PAUSED[\s\S]*CANCEL_REQUESTED[\s\S]*COMPLETED[\s\S]*FAILED[\s\S]*TIMED_OUT/, "ResearchComposer should provide status-specific copy for the visible run state");
  assertContains("src/features/workspace/ResearchComposer.tsx", /canPause:\s*boolean/, "ResearchComposer should receive computed pause availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /canResume:\s*boolean/, "ResearchComposer should receive computed resume availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /canCancel:\s*boolean/, "ResearchComposer should receive computed cancel availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /pausing\?:\s*boolean/, "ResearchComposer should receive pause loading state");
  assertContains("src/features/workspace/ResearchComposer.tsx", /resuming\?:\s*boolean/, "ResearchComposer should receive resume loading state");
  assertContains("src/features/workspace/ResearchComposer.tsx", /cancelling\?:\s*boolean/, "ResearchComposer should receive cancel loading state");
  assertContains("src/features/workspace/ResearchComposer.tsx", /data-run-status=\{normalizedRunStatus\}/, "Composer should expose the current run status for styling and tests");
  assertContains("src/features/workspace/ResearchComposer.tsx", /research-run-state--\$\{toStateClass\(normalizedRunStatus\)\}/, "Composer should style run states by status");
  assertContains("src/features/workspace/ResearchComposer.tsx", /aria-label="暂停当前运行"/, "Pause action should have an accessible label");
  assertContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!canPause\}/, "Pause action should use computed availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /loading=\{pausing\}/, "Pause action should show loading while pausing");
  assertContains("src/features/workspace/ResearchComposer.tsx", /aria-label="继续当前运行"/, "Resume action should have an accessible label");
  assertContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!canResume\}/, "Resume action should use computed availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /loading=\{resuming\}/, "Resume action should show loading while resuming");
  assertContains("src/features/workspace/ResearchComposer.tsx", /aria-label="取消当前运行"/, "Cancel action should have an accessible label");
  assertContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!canCancel\}/, "Cancel action should use computed availability");
  assertContains("src/features/workspace/ResearchComposer.tsx", /loading=\{cancelling\}/, "Cancel action should show loading while cancelling");
  assertNotContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!running \|\| paused\}/, "Pause action should no longer depend on the coarse running/paused pair");
  assertNotContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!running \|\| !paused\}/, "Resume action should no longer depend on the coarse running/paused pair");
  assertNotContains("src/features/workspace/ResearchComposer.tsx", /disabled=\{!running\}/, "Cancel action should no longer be enabled by coarse running alone");

  assertContains("src/pages/WorkspacePage.tsx", /type RunControlAction = "pause" \| "resume" \| "cancel" \| null/, "WorkspacePage should track which run control request is in flight");
  assertContains("src/pages/WorkspacePage.tsx", /const activeRunStatus = activeRun\?\.status \?\? null/, "WorkspacePage should derive the active run status once");
  assertContains("src/pages/WorkspacePage.tsx", /const canPauseRun = isPausableRunStatus\(activeRunStatus\) && controlRunAction === null/, "WorkspacePage should compute pause availability from run status");
  assertContains("src/pages/WorkspacePage.tsx", /const canResumeRun = activeRunStatus === "PAUSED" && controlRunAction === null/, "WorkspacePage should compute resume availability from paused status");
  assertContains("src/pages/WorkspacePage.tsx", /const canCancelRun = isCancelableRunStatus\(activeRunStatus\) && controlRunAction === null/, "WorkspacePage should compute cancel availability from cancelable statuses");
  assertContains("src/pages/WorkspacePage.tsx", /setControlRunAction\("cancel"\)/, "Cancel requests should set a specific loading state");
  assertContains("src/pages/WorkspacePage.tsx", /setControlRunAction\("pause"\)/, "Pause requests should set a specific loading state");
  assertContains("src/pages/WorkspacePage.tsx", /setControlRunAction\("resume"\)/, "Resume requests should set a specific loading state");
  assertContains("src/pages/WorkspacePage.tsx", /canPause=\{canPauseRun\}/, "WorkspacePage should pass pause availability to the composer");
  assertContains("src/pages/WorkspacePage.tsx", /canResume=\{canResumeRun\}/, "WorkspacePage should pass resume availability to the composer");
  assertContains("src/pages/WorkspacePage.tsx", /canCancel=\{canCancelRun\}/, "WorkspacePage should pass cancel availability to the composer");
  assertContains("src/pages/WorkspacePage.tsx", /pausing=\{controlRunAction === "pause"\}/, "WorkspacePage should pass pause loading to the composer");
  assertContains("src/pages/WorkspacePage.tsx", /resuming=\{controlRunAction === "resume"\}/, "WorkspacePage should pass resume loading to the composer");
  assertContains("src/pages/WorkspacePage.tsx", /cancelling=\{controlRunAction === "cancel" \|\| activeRunStatus === "CANCEL_REQUESTED"\}/, "WorkspacePage should show cancelling for local and server cancellation states");
  assertContains("src/pages/WorkspacePage.tsx", /<Alert tone="warning" title="实时连接中断"[\s\S]*onClick=\{\(\) => selectedSessionId && void loadSessionDetail\(selectedSessionId\)\}/, "SSE interruption should show a recovery alert without clearing live events");
  assertContains("src/pages/WorkspacePage.tsx", /setLiveEvents\(\(current\) => \[\.\.\.current, normalized\]\.slice\(-60\)\)/, "Live events should be appended and preserved during streaming");

  assertContains("src/features/workspace/ExecutionTimeline.tsx", /data-status=\{normalizeFeedStatus\(item\.status\)\}/, "Feed cards should expose status-specific styling hooks");
  assertContains("src/features/workspace/ExecutionTimeline.tsx", /function normalizeFeedStatus/, "ExecutionTimeline should normalize status names for data attributes");
  assertContains("src/features/workspace/workspaceViewModel.ts", /export type TimelineStatus =[\s\S]*"PAUSED"[\s\S]*"CANCEL_REQUESTED"[\s\S]*"CANCELLED"[\s\S]*"TIMED_OUT"/, "Timeline status type should include run lifecycle statuses");
  assertContains("src/components/ui/StatusPill.tsx", /data-status=\{normalized\}/, "StatusPill should expose the normalized status for testing and styling");
  assertContains("src/components/ui/StatusPill.tsx", /data-tone=\{config\.tone\}/, "StatusPill should expose the semantic tone");

  assertContains("src/styles/pages.css", /\.research-run-state\s*\{/, "Composer run state should have a dedicated style");
  assertContains("src/styles/pages.css", /\.research-run-state--running/, "Running state should have a dedicated visual treatment");
  assertContains("src/styles/pages.css", /\.research-run-state--paused/, "Paused state should have a dedicated visual treatment");
  assertContains("src/styles/pages.css", /\.research-run-state--cancel-requested/, "Cancel requested state should have a dedicated visual treatment");
  assertContains("src/styles/pages.css", /\.research-run-state--failed/, "Failed state should have a dedicated visual treatment");
  assertContains("src/styles/pages.css", /\.research-run-state--completed/, "Completed state should have a dedicated visual treatment");
  assertContains("src/styles/pages.css", /\.agent-feed-card\[data-status="running"\]/, "Running feed items should have status-specific styling");
  assertContains("src/styles/pages.css", /\.agent-feed-card\[data-status="paused"\]/, "Paused feed items should have status-specific styling");
  assertContains("src/styles/pages.css", /\.agent-feed-card\[data-status="failed"\]/, "Failed feed items should have status-specific styling");
  assertContains("src/styles/pages.css", /\.agent-feed-card\[data-status="completed"\]/, "Completed feed items should have status-specific styling");

  assertContains("package.json", /"test:research-run-states":\s*"node scripts\/verify-research-run-states\.mjs"/, "package script should expose the W06 verifier");
}

try {
  main();
  console.log("Research run state verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
