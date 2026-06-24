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
  assertContains("src/features/image/ImageCompareDialog.tsx", /import \{ ImageHistoryItem \} from "\.\.\/\.\.\/services\/api"/, "Compare dialog should use image history items");
  assertContains("src/features/image/ImageCompareDialog.tsx", /import \{ Badge, Button, Dialog, StatusPill \} from "\.\.\/\.\.\/components\/ui"/, "Compare dialog should reuse existing UI primitives");
  assertContains("src/features/image/ImageCompareDialog.tsx", /type ImageCompareDialogProps = \{[\s\S]*items: ImageHistoryItem\[\][\s\S]*isOpen: boolean[\s\S]*onClose: \(\) => void/, "Compare dialog should accept selected items and open state");
  assertContains("src/features/image/ImageCompareDialog.tsx", /const visibleItems = items\.slice\(0, 4\)/, "Compare dialog should only show the first four selected images");
  assertContains("src/features/image/ImageCompareDialog.tsx", /const hasOverflow = items\.length > 4/, "Compare dialog should detect over-selection");
  assertContains("src/features/image/ImageCompareDialog.tsx", /超过 4 张时仅展示前 4 张/, "Compare dialog should explain over-selection behavior");
  assertContains("src/features/image/ImageCompareDialog.tsx", /className="image-compare-grid"/, "Compare dialog should render a stable comparison grid");
  assertContains("src/features/image/ImageCompareDialog.tsx", /className="image-compare-card"/, "Compare dialog should render comparable image cards");
  assertContains("src/features/image/ImageCompareDialog.tsx", /className="image-compare-card__frame"/, "Compare cards should have a framed preview region");
  assertContains("src/features/image/ImageCompareDialog.tsx", /className="image-compare-card__meta"/, "Compare cards should show structured metadata");
  assertContains("src/features/image/ImageCompareDialog.tsx", /StatusPill status=\{item\.status\}/, "Compare cards should keep status visible");
  assertContains("src/features/image/ImageCompareDialog.tsx", /item\.resultUrl \? <img[\s\S]*className="image-compare-card__image"/, "Compare cards should show image previews when URLs exist");
  assertContains("src/features/image/ImageCompareDialog.tsx", /暂无预览/, "Compare cards should handle missing image URLs");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /import \{ ImageCompareDialog \} from "\.\/ImageCompareDialog"/, "History panel should import the compare dialog");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const \[compareOpen, setCompareOpen\] = useState\(false\)/, "History panel should track compare dialog state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const selectedItems = items\.filter\(\(item\) => selection\.selectedIds\.includes\(item\.jobId\)\)/, "History panel should derive selected image items");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const canCompare = selection\.selectedCount >= 2/, "Compare action should require at least two selections");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const compareDescription = selection\.selectedCount > 4 \? "将对比前 4 张选中图片" : "选择 2 到 4 张图片进行对比"/, "History panel should describe the 2-4 image boundary");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{\(\) => setCompareOpen\(true\)\}[\s\S]*disabled=\{!canCompare\}/, "Compare action should be disabled until at least two images are selected");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /对比图片/, "History panel should expose a compare action");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<ImageCompareDialog[\s\S]*items=\{selectedItems\}[\s\S]*isOpen=\{compareOpen\}[\s\S]*onClose=\{\(\) => setCompareOpen\(false\)\}/, "History panel should render the compare dialog with selected items");

  assertContains("src/styles/pages.css", /\.image-compare-grid\s*\{[\s\S]*overflow-x:\s*auto;/, "Compare grid should allow horizontal scrolling");
  assertContains("src/styles/pages.css", /\.image-compare-card\s*\{[\s\S]*min-width:\s*220px;/, "Compare cards should keep a usable width in horizontal scroll");
  assertContains("src/styles/pages.css", /\.image-compare-card__frame\s*\{[\s\S]*aspect-ratio:\s*1;/, "Compare preview frames should be stable squares");
  assertContains("src/styles/pages.css", /\.image-compare-card__image\s*\{[\s\S]*object-fit:\s*contain;/, "Compare images should fit without cropping");
  assertContains("src/styles/pages.css", /\.image-compare-card__meta\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, "Compare metadata should be structured for scanning");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.image-compare-grid\s*\{[\s\S]*grid-auto-columns:\s*minmax\(220px,\s*82vw\)/, "Compare grid should remain horizontally scrollable on mobile");

  assertContains("package.json", /"test:image-compare":\s*"node scripts\/verify-image-compare\.mjs"/, "package script should expose the I05 verifier");
  assertContains("../docs/tasks.md", /\| I05 \| 已完成 \|[\s\S]*ImageCompareDialog[\s\S]*2 到 4 张图片对比[\s\S]*少于 2 张禁用[\s\S]*超过 4 张提示/, "docs/tasks.md should record I05 completion and boundaries");
}

try {
  main();
  console.log("Image compare verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
