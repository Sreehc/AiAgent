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
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const completedCount = items\.filter\(\(item\) => item\.status === "COMPLETED"\)\.length/, "History panel should summarize completed image count");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const failedCount = items\.filter\(\(item\) => item\.status === "FAILED"\)\.length/, "History panel should summarize failed image count");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-history-toolbar__stats"/, "History toolbar should expose compact stats");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<Badge tone="neutral" className="tabular-nums">\{completedCount\} 完成<\/Badge>/, "History toolbar should show completed count");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /failedCount > 0 \? <Badge tone="danger" className="tabular-nums">\{failedCount\} 失败<\/Badge> : null/, "History toolbar should highlight failed count when present");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /aria-label=\{`图片历史：\$\{item\.mode === "IMAGES" \? "文本生图" : "参考图编辑"\}，\$\{item\.status\}`\}/, "Image cards should have a useful aria label");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-mode=\{item\.mode\.toLowerCase\(\)\}/, "Image cards should expose mode for styling and future selection work");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-has-session=\{Boolean\(item\.sessionId\) \|\| undefined\}/, "Image cards should expose whether they are associated with a session");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__frame"/, "Image cards should wrap thumbnails in a framed media surface");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__status"/, "Image cards should have a dedicated status overlay");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__prompt"/, "Image card prompt should have a dedicated text hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__metadata"/, "Image cards should use structured metadata rows");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<span>尺寸<\/span>[\s\S]*<strong className="tabular-nums">\{item\.size\}<\/strong>/, "Image cards should show size as a labelled field");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<span>时间<\/span>[\s\S]*formatDateTime\(item\.createdAt\)/, "Image cards should show created time as a labelled field");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<span>会话<\/span>[\s\S]*title=\{item\.sessionId \?\? "未挂接"\}/, "Image cards should show session association with full title");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="id-text truncate-id image-card__session"/, "Session association should use mono truncation");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__actions"/, "Image cards should keep actions in a stable region");

  assertContains("src/styles/pages.css", /\.image-history-toolbar__stats\s*\{[\s\S]*display:\s*flex;/, "History toolbar stats should be styled");
  assertContains("src/styles/pages.css", /\.image-card\s*\{[\s\S]*transition:/, "Image cards should have clear hover/focus transitions");
  assertContains("src/styles/pages.css", /\.image-card:hover\s*\{[\s\S]*border-color:\s*var\(--color-border-strong\)/, "Image card hover should clarify tile edges");
  assertContains("src/styles/pages.css", /\.image-card__frame\s*\{[\s\S]*outline:\s*1px solid/, "Image thumbnail frame should use a visible outline");
  assertContains("src/styles/pages.css", /\.image-card\[data-status="failed"\] \.image-card__frame\s*\{[\s\S]*border-color:\s*color-mix\(in srgb,\s*var\(--color-danger\)/, "Failed thumbnails should have a clear danger edge");
  assertContains("src/styles/pages.css", /\.image-card__status\s*\{[\s\S]*position:\s*absolute;/, "Image status overlay should be positioned on the thumbnail");
  assertContains("src/styles/pages.css", /\.image-card__metadata\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/, "Image metadata should be a three-column comparison grid");
  assertContains("src/styles/pages.css", /\.image-card__metadata-item\s*\{/, "Image metadata fields should have dedicated styles");
  assertContains("src/styles/pages.css", /\.image-card__session\s*\{[\s\S]*max-width:/, "Session IDs should have a constrained visual width");
  assertContains("src/styles/pages.css", /\.image-card__actions\s*\{[\s\S]*min-height:\s*36px;/, "Image card actions should have stable height");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.image-card__metadata\s*\{[\s\S]*grid-template-columns:\s*1fr;/, "Image card metadata should stack on narrow mobile tiles");

  assertContains("package.json", /"test:image-history-grid":\s*"node scripts\/verify-image-history-grid\.mjs"/, "package script should expose the I02 verifier");
}

try {
  main();
  console.log("Image history grid verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
