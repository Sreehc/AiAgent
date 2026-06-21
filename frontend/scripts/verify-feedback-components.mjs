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

function main() {
  for (const tone of ["info", "success", "warning", "error"]) {
    assertContains("src/components/ui/Alert.tsx", new RegExp(`${tone}:\\s*"`), `Alert should define ${tone} tone`);
  }
  assertContains("src/components/ui/Alert.tsx", /title\?:\s*ReactNode/, "Alert should support an optional title");
  assertContains("src/components/ui/Alert.tsx", /action\?:\s*ReactNode/, "Alert should support an action slot");
  assertContains("src/components/ui/Alert.tsx", /onDismiss\?:\s*\(\) => void/, "Alert should support dismissible alerts");
  assertContains("src/components/ui/Alert.tsx", /aria-label=\{dismissLabel\}/, "Dismiss button should have an aria-label");
  assertContains("src/components/ui/Alert.tsx", /role=\{tone === "error" \? "alert" : "status"\}/, "Error alerts should use role=alert and other tones role=status");
  assertContains("src/components/ui/Alert.tsx", /aria-live=\{tone === "error" \? "assertive" : "polite"\}/, "Alert should expose live-region semantics");
  assertContains("src/components/ui/Alert.tsx", /AlertTriangle/, "Warning alerts should include a semantic icon");

  assertContains("src/components/ui/EmptyState.tsx", /variant\?:\s*"plain" \| "permission" \| "no-results" \| "first-run"/, "EmptyState should support required variants");
  assertContains("src/components/ui/EmptyState.tsx", /secondaryAction\?:\s*ReactNode/, "EmptyState should support a secondary action");
  assertContains("src/components/ui/EmptyState.tsx", /emptyStateVariants/, "EmptyState should centralize variant styling");
  assertContains("src/components/ui/EmptyState.tsx", /permission:\s*"[^"]*border-warning/, "Permission empty state should use warning semantics");
  assertContains("src/components/ui/EmptyState.tsx", /"no-results":\s*"[^"]*border-info/, "No-results empty state should use info semantics");
  assertContains("src/components/ui/EmptyState.tsx", /"first-run":\s*"[^"]*border-primary/, "First-run empty state should use primary semantics");
  assertContains("src/components/ui/EmptyState.tsx", /action \|\| secondaryAction/, "EmptyState should reserve an action area only when actions exist");

  assertContains("src/components/ui/Skeleton.tsx", /variant\?:\s*"list" \| "table" \| "card" \| "feed" \| "form"/, "Skeleton should support list/table/card/feed/form variants");
  assertContains("src/components/ui/Skeleton.tsx", /label\?:\s*string/, "Skeleton should support a custom loading label");
  assertContains("src/components/ui/Skeleton.tsx", /skeletonVariants/, "Skeleton should centralize variant rendering");
  for (const variant of ["list", "table", "card", "feed", "form"]) {
    assertContains("src/components/ui/Skeleton.tsx", new RegExp(`${variant}:\\s*\\(`), `Skeleton should render ${variant} layout`);
  }
  assertContains("src/components/ui/Skeleton.tsx", /aria-busy="true"/, "Skeleton should expose busy state");
  assertContains("src/components/ui/Skeleton.tsx", /role="status"/, "Skeleton should expose status semantics");
  assertContains("src/components/ui/Skeleton.tsx", /motion-reduce:animate-none/, "Skeleton should respect reduced motion");
}

try {
  main();
  console.log("Feedback component verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
