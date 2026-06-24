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
  assertContains("src/components/ui/FormControls.tsx", /import \* as RadixSelect from "@radix-ui\/react-select";/, "Select should use Radix Select primitives");
  assertContains("src/components/ui/FormControls.tsx", /function normalizeSelectOptions/, "Select should normalize legacy option children");
  assertContains("src/components/ui/FormControls.tsx", /<RadixSelect\.Trigger/, "Select should render a custom trigger");
  assertContains("src/components/ui/FormControls.tsx", /<RadixSelect\.Content/, "Select should render a custom dropdown content layer");
  assertNotContains("src/components/ui/FormControls.tsx", /return <select/, "Select should no longer render a native select element");

  assertContains("src/styles/components.css", /\.select-trigger\s*\{/, "Select trigger styles should exist");
  assertContains("src/styles/components.css", /\.select-content\s*\{/, "Select dropdown styles should exist");
  assertContains("src/styles/components.css", /\.select-item\s*\{/, "Select item styles should exist");

  assertContains("src/features/image/ImageGenerationForm.tsx", /<Select value=\{form\.size\}/, "Image generation form should still use shared Select");
  assertContains("src/features/history/HistoryFilters.tsx", /<Select value=\{status\}/, "History filters should still use shared Select");
  assertContains("src/features/system/ModelForm.tsx", /<Select value=\{form\.modelType\}/, "Model form should still use shared Select");
  assertContains("src/features/system/McpServerForm.tsx", /<Select value=\{form\.transportType\}/, "MCP form should still use shared Select");

  assertContains("package.json", /"test:select-upgrade":\s*"node scripts\/verify-select-upgrade\.mjs"/, "package script should expose the select verifier");
}

try {
  main();
  console.log("Select upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
