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
  assertContains("src/features/image/useImageSelection.ts", /export function useImageSelection\(items: ImageHistoryItem\[\]\)/, "Image selection state should live in a dedicated hook");
  assertContains("src/features/image/useImageSelection.ts", /const \[selectionMode, setSelectionMode\] = useState\(false\)/, "Selection hook should track selection mode");
  assertContains("src/features/image/useImageSelection.ts", /const \[selectedIds, setSelectedIds\] = useState<string\[\]>\(\[\]\)/, "Selection hook should track selected ids");
  assertContains("src/features/image/useImageSelection.ts", /const selectedCount = selectedIds\.length/, "Selection hook should expose selected count");
  assertContains("src/features/image/useImageSelection.ts", /const hasSelection = selectedCount > 0/, "Selection hook should expose whether anything is selected");
  assertContains("src/features/image/useImageSelection.ts", /function enterSelectionMode\(\)/, "Selection hook should enter selection mode");
  assertContains("src/features/image/useImageSelection.ts", /function exitSelectionMode\(\)[\s\S]*setSelectionMode\(false\)[\s\S]*setSelectedIds\(\[\]\)/, "Exiting selection mode should clear the collection");
  assertContains("src/features/image/useImageSelection.ts", /function toggleSelection\(jobId: string\)/, "Selection hook should toggle image ids");
  assertContains("src/features/image/useImageSelection.ts", /function selectAll\(\)/, "Selection hook should support selecting the current page");
  assertContains("src/features/image/useImageSelection.ts", /function clearSelection\(\)/, "Selection hook should clear selected ids without leaving selection mode");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /import \{ useImageSelection \} from "\.\/useImageSelection"/, "History panel should use the dedicated selection hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const selection = useImageSelection\(items\)/, "History panel should initialize selection state from current items");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-selection-toolbar"/, "History panel should render a selection toolbar");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-selection-mode=\{selection\.selectionMode \|\| undefined\}/, "Selection toolbar should expose mode state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /selection\.selectedCount\} 已选/, "Selection toolbar should display selected count");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{selection\.enterSelectionMode\}/, "Toolbar should enter selection mode");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{selection\.exitSelectionMode\}/, "Toolbar should exit selection mode");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{selection\.selectAll\}/, "Toolbar should support selecting the current page");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{selection\.clearSelection\}[\s\S]*disabled=\{!selection\.hasSelection\}/, "Clear selection action should be disabled when nothing is selected");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /selectionMode=\{selection\.selectionMode\}/, "Cards should receive selection mode");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /selected=\{selection\.isSelected\(item\.jobId\)\}/, "Cards should receive selected state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /selectionOrder=\{selection\.getSelectionOrder\(item\.jobId\)\}/, "Cards should receive selected order");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onToggleSelection=\{selection\.toggleSelection\}/, "Cards should receive selection toggler");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-selectable=\{selectionMode \|\| undefined\}/, "Image card should expose selectable state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-selected=\{selected \|\| undefined\}/, "Image card should expose selected state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /aria-selected=\{selectionMode \? selected : undefined\}/, "Image card should expose aria-selected only in selection mode");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__selection"/, "Image card should render a selection overlay");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /type="checkbox"[\s\S]*checked=\{selected\}[\s\S]*onChange=\{\(\) => onToggleSelection\(item\.jobId\)\}/, "Selection overlay should contain a real checkbox");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /selected \? selectionOrder : ""/, "Selected tiles should show their selection order");

  assertContains("src/styles/pages.css", /\.image-selection-toolbar\s*\{[\s\S]*position:\s*sticky;/, "Selection toolbar should stay visible above the grid");
  assertContains("src/styles/pages.css", /\.image-selection-toolbar__actions\s*\{[\s\S]*display:\s*flex;/, "Selection toolbar actions should be laid out");
  assertContains("src/styles/pages.css", /\.image-card\[data-selectable="true"\]/, "Selectable image cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.image-card\[data-selected="true"\]\s*\{[\s\S]*border-color:\s*color-mix\(in srgb,\s*var\(--color-primary\)/, "Selected cards should have a primary outline");
  assertContains("src/styles/pages.css", /\.image-card__selection\s*\{[\s\S]*position:\s*absolute;/, "Selection overlay should be positioned over the thumbnail");
  assertContains("src/styles/pages.css", /\.image-card__selection input\s*\{[\s\S]*position:\s*absolute;/, "Selection checkbox should remain accessible while visually custom");
  assertContains("src/styles/pages.css", /\.image-card__selection-indicator\s*\{/, "Selection indicator should have dedicated styles");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.image-selection-toolbar\s*\{[\s\S]*display:\s*grid;/, "Selection toolbar should stack on mobile");

  assertContains("package.json", /"test:image-batch-selection":\s*"node scripts\/verify-image-batch-selection\.mjs"/, "package script should expose the I03 verifier");
}

try {
  main();
  console.log("Image batch selection verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
