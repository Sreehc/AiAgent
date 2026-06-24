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
  assertContains("src/features/knowledge/DocumentTable.tsx", /function getDocumentDisplayStatus/, "DocumentTable should derive display status from parse status and active indexing actions");
  assertContains("src/features/knowledge/DocumentTable.tsx", /isBusy \? "PROCESSING" : document\.parseStatus/, "Busy document rows should display PROCESSING immediately");
  assertContains("src/features/knowledge/DocumentTable.tsx", /function isFailedDocument/, "DocumentTable should detect failed documents");
  assertContains("src/features/knowledge/DocumentTable.tsx", /function getIndexActionLabel/, "DocumentTable should centralize index action labels");
  assertContains("src/features/knowledge/DocumentTable.tsx", /function shouldReindexDocument/, "DocumentTable should centralize index vs reindex routing");
  assertContains("src/features/knowledge/DocumentTable.tsx", /function formatFileSize/, "DocumentTable should format raw file sizes");
  assertContains("src/features/knowledge/DocumentTable.tsx", /function formatDateTime/, "DocumentTable should format timestamps");

  assertContains("src/features/knowledge/DocumentTable.tsx", /<Table[\s\S]*minWidth="980px"/, "Document table should use a wider minWidth for dense document fields");
  assertContains("src/features/knowledge/DocumentTable.tsx", /<TableHead>文档<\/TableHead>[\s\S]*<TableHead status>状态<\/TableHead>[\s\S]*<TableHead numeric>版本<\/TableHead>[\s\S]*<TableHead numeric>大小<\/TableHead>[\s\S]*<TableHead numeric>Chunks<\/TableHead>[\s\S]*<TableHead>错误摘要<\/TableHead>/, "Document table should split document status, version, size, chunks and error into distinct columns");
  assertContains("src/features/knowledge/DocumentTable.tsx", /<TableRow[\s\S]*disabled=\{isBusy\}[\s\S]*data-document-status=\{displayStatus\}[\s\S]*data-has-error=\{failed \|\| undefined\}/, "Document rows should expose busy/error state semantics");
  assertContains("src/features/knowledge/DocumentTable.tsx", /className="document-row__title"/, "Document filename should use a dedicated title hook");
  assertContains("src/features/knowledge/DocumentTable.tsx", /className="document-row__meta"/, "Document type and id should use a dedicated metadata hook");
  assertContains("src/features/knowledge/DocumentTable.tsx", /<StatusPill status=\{getStatusPillStatus\(displayStatus\)\} label=\{formatParseStatus\(displayStatus\)\}/, "Document status should use localized labels and semantic status tones");
  assertContains("src/features/knowledge/DocumentTable.tsx", /<TableCell numeric>\s*<span className="tabular-nums">v\{document\.versionNo\}<\/span>\s*<\/TableCell>/, "Version should be a numeric table column");
  assertContains("src/features/knowledge/DocumentTable.tsx", /formatFileSize\(document\.fileSize\)/, "File size should be formatted in the size column");
  assertContains("src/features/knowledge/DocumentTable.tsx", /document\.chunkCount[\s\S]*chunks/, "Chunk count should be visible as its own column");
  assertContains("src/features/knowledge/DocumentTable.tsx", /className="document-error-summary"/, "Document errors should use a dedicated error summary hook");
  assertContains("src/features/knowledge/DocumentTable.tsx", /title=\{document\.lastError \?\? undefined\}/, "Full document error should be available via title");
  assertContains("src/features/knowledge/DocumentTable.tsx", /getIndexActionLabel\(document, isBusy\)/, "Index action text should be derived from document state");
  assertContains("src/features/knowledge/DocumentTable.tsx", /shouldReindexDocument\(document\) \? onReindex\(document\.documentId\) : onIndex\(document\.documentId\)/, "Failed and indexed documents should route through reindex while new documents use index");
  assertContains("src/features/knowledge/DocumentTable.tsx", /disabled=\{isBusy\}/, "Index action should be disabled while a row is indexing");
  assertContains("src/features/knowledge/DocumentTable.tsx", /aria-label=\{`\$\{indexActionLabel\}：\$\{document\.fileName\}`\}/, "Index action should have an accessible document-specific label");

  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /function formatFileSize/, "DocumentVersionsPanel should format raw file sizes");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /function formatDateTime/, "DocumentVersionsPanel should format timestamps");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /className="document-version-panel"/, "Version panel should expose a dedicated style hook");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /<Table[\s\S]*minWidth="860px"/, "Version table should have a stable minWidth");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /<TableHead numeric>版本<\/TableHead>[\s\S]*<TableHead status>状态<\/TableHead>[\s\S]*<TableHead numeric>大小<\/TableHead>[\s\S]*<TableHead numeric>Chunks<\/TableHead>[\s\S]*<TableHead>创建时间<\/TableHead>[\s\S]*<TableHead>文档 ID<\/TableHead>/, "Version table should expose version, status, size, chunks, time and id columns");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /当前最高版本/, "Version panel should keep a clear current-version marker");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /StatusPill status=\{getStatusPillStatus\(item\.parseStatus\)\} label=\{formatParseStatus\(item\.parseStatus\)\}/, "Version rows should use localized status labels and semantic tones");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /formatFileSize\(item\.fileSize\)/, "Version rows should show formatted size");
  assertContains("src/features/knowledge/DocumentVersionsPanel.tsx", /item\.chunkCount[\s\S]*chunks/, "Version rows should show chunk count");

  assertContains("src/styles/pages.css", /\.document-row__title/, "Document title should have dedicated styles");
  assertContains("src/styles/pages.css", /\.document-row__meta/, "Document metadata should have dedicated styles");
  assertContains("src/styles/pages.css", /\.document-error-summary/, "Document error summary should have dedicated styles");
  assertContains("src/styles/pages.css", /\.document-actions/, "Document actions should have dedicated styles");
  assertContains("src/styles/pages.css", /\.document-version-panel/, "Document version panel should have dedicated styles");
  assertContains("package.json", /"test:document-table-upgrade":\s*"node scripts\/verify-document-table-upgrade\.mjs"/, "package script should expose the K02 verifier");
}

try {
  main();
  console.log("Document table upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
