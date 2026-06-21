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
  assertContains("src/components/ui/Badge.tsx", /rounded-\[var\(--radius-sm\)\]/, "Badge should use a compact rectangle radius token");
  assertNotContains("src/components/ui/Badge.tsx", /rounded-full/, "Badge should not default to a pill shape");
  assertContains("src/components/ui/Badge.tsx", /px-1\.5/, "Badge should use compact horizontal padding");
  assertContains("src/components/ui/Badge.tsx", /text-\[11px\]/, "Badge should use compact label typography");
  assertContains("src/components/ui/Badge.tsx", /tone:\s*"neutral"\s*\}/, "Badge should default to neutral tone");
  for (const tone of ["primary", "neutral", "success", "warning", "danger", "info"]) {
    assertContains("src/components/ui/Badge.tsx", new RegExp(`${tone}:\\s*"`), `Badge should define ${tone} tone`);
  }

  assertContains("src/components/ui/StatusPill.tsx", /const STATUS_CONFIG/, "StatusPill should use explicit status mapping");
  for (const status of ["IDLE", "PENDING", "RUNNING", "PROCESSING", "PAUSED", "CANCEL_REQUESTED", "CANCELLED", "COMPLETED", "SUCCESS", "FAILED", "ERROR", "TIMED_OUT", "HEALTHY", "ACTIVE", "UNHEALTHY", "INACTIVE"]) {
    assertContains("src/components/ui/StatusPill.tsx", new RegExp(`${status}:\\s*\\{`), `StatusPill should map ${status}`);
  }
  assertContains("src/components/ui/StatusPill.tsx", /IDLE:\s*\{\s*tone:\s*"neutral",\s*label:\s*"空闲"/, "IDLE should use neutral tone and Chinese label");
  assertContains("src/components/ui/StatusPill.tsx", /RUNNING:\s*\{\s*tone:\s*"running",\s*label:\s*"执行中"/, "RUNNING should use running tone and Chinese label");
  assertContains("src/components/ui/StatusPill.tsx", /PROCESSING:\s*\{\s*tone:\s*"running",\s*label:\s*"处理中"/, "PROCESSING should use running tone and Chinese label");
  assertContains("src/components/ui/StatusPill.tsx", /UNKNOWN_CONFIG/, "StatusPill should preserve unknown values through neutral fallback");
  assertContains("src/components/ui/StatusPill.tsx", /label \?\? config\.label \?\? normalized/, "StatusPill unknown statuses should show the original normalized value");
  assertContains("src/components/ui/StatusPill.tsx", /role="status"/, "StatusPill should expose status semantics");
  assertContains("src/components/ui/StatusPill.tsx", /animate-pulse motion-reduce:animate-none/, "Running status should pulse while respecting reduced motion");
}

try {
  main();
  console.log("Badge and status verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
