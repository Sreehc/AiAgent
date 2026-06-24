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
  assertContains("src/components/ui/FormControls.tsx", /export \{ FileInput \} from "\.\/FileInput";/, "Form controls should re-export a reusable FileInput component");
  assertContains("src/components/ui/FileInput.tsx", /className="file-input__native sr-only"/, "FileInput should hide the native input");
  assertContains("src/components/ui/FileInput.tsx", /type="button"/, "FileInput should use a button trigger instead of nesting another label");
  assertNotContains("src/components/ui/FileInput.tsx", /<label className="file-input__surface"/, "FileInput should not nest a label inside Field");
  assertContains("src/components/ui/FileInput.tsx", /选择文件/, "FileInput should render a custom trigger label");
  assertContains("src/components/ui/FileInput.tsx", /未选择任何文件/, "FileInput should render an explicit empty state label");

  assertContains("src/components/ui/index.ts", /FileInput/, "UI index should export FileInput");

  assertContains("src/features/knowledge/DocumentTable.tsx", /<FileInput/, "Knowledge document upload should use FileInput");
  assertNotContains("src/features/knowledge/DocumentTable.tsx", /<Input[^>]*type=\"file\"/, "Knowledge document upload should no longer use native file Input");

  assertContains("src/features/image/ImageGenerationForm.tsx", /<FileInput/, "Image reference upload should use FileInput");
  assertNotContains("src/features/image/ImageGenerationForm.tsx", /<Input[^>]*type=\"file\"/, "Image reference upload should no longer use native file Input");

  assertContains("src/features/workspace/ArtifactPanel.tsx", /<FileInput/, "Artifact upload should use FileInput");
  assertNotContains("src/features/workspace/ArtifactPanel.tsx", /<Input[^>]*type=\"file\"/, "Artifact upload should no longer use native file Input");

  assertContains("src/styles/components.css", /\.file-input\s*\{/, "Shared file input styles should exist");
  assertContains("src/styles/components.css", /\.file-input__trigger/, "Shared file input trigger styles should exist");
  assertContains("src/styles/pages.css", /\.upload-row\s*\{[\s\S]*align-items:\s*center;/, "Upload rows should vertically center the field and action");

  assertContains("package.json", /"test:file-input-upgrade":\s*"node scripts\/verify-file-input-upgrade\.mjs"/, "package script should expose the file input verifier");
}

try {
  main();
  console.log("File input upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
