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
  assertContains("src/features/image/useImageDownloads.ts", /import \{ useState \} from "react"/, "Download state should live in a dedicated hook");
  assertContains("src/features/image/useImageDownloads.ts", /import \{ ImageHistoryItem \} from "\.\.\/\.\.\/services\/api"/, "Download helper should use image history items");
  assertContains("src/features/image/useImageDownloads.ts", /type ImageDownloadFailure = \{[\s\S]*jobId: string[\s\S]*url: string[\s\S]*reason: string/, "Download failures should include job id, url, and reason");
  assertContains("src/features/image/useImageDownloads.ts", /function getImageDownloadFilename\(item: ImageHistoryItem\)/, "Download helper should generate stable filenames");
  assertContains("src/features/image/useImageDownloads.ts", /async function downloadImageItem\(item: ImageHistoryItem\)/, "Download helper should download one selected image");
  assertContains("src/features/image/useImageDownloads.ts", /const response = await fetch\(item\.resultUrl\)/, "Download helper should fetch image data for direct downloads");
  assertContains("src/features/image/useImageDownloads.ts", /URL\.createObjectURL\(blob\)/, "Download helper should use object URLs for blob downloads");
  assertContains("src/features/image/useImageDownloads.ts", /URL\.revokeObjectURL\(objectUrl\)/, "Download helper should clean up object URLs");
  assertContains("src/features/image/useImageDownloads.ts", /export function useImageDownloads\(\)/, "Download collection should expose a hook");
  assertContains("src/features/image/useImageDownloads.ts", /const \[downloading, setDownloading\] = useState\(false\)/, "Download hook should expose loading state");
  assertContains("src/features/image/useImageDownloads.ts", /const \[downloadFailures, setDownloadFailures\] = useState<ImageDownloadFailure\[\]>\(\[\]\)/, "Download hook should expose fallback links");
  assertContains("src/features/image/useImageDownloads.ts", /const \[downloadFeedback, setDownloadFeedback\] = useState<string \| null>\(null\)/, "Download hook should expose user feedback");
  assertContains("src/features/image/useImageDownloads.ts", /async function downloadCollection\(items: ImageHistoryItem\[\]\)/, "Download hook should download selected items");
  assertContains("src/features/image/useImageDownloads.ts", /const downloadableItems = items\.filter\(\(item\) => Boolean\(item\.resultUrl\)\)/, "Download hook should ignore items without result URLs");
  assertContains("src/features/image/useImageDownloads.ts", /setDownloading\(true\)[\s\S]*finally[\s\S]*setDownloading\(false\)/, "Download hook should always clear loading state");
  assertContains("src/features/image/useImageDownloads.ts", /setDownloadFailures\(failures\)/, "Download hook should store failed direct downloads");
  assertContains("src/features/image/useImageDownloads.ts", /部分图片无法直接下载，请使用下方链接打开/, "Download hook should explain cross-origin fallback links");
  assertContains("src/features/image/useImageDownloads.ts", /没有可下载的图片链接/, "Download hook should handle empty selected result URLs");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /import \{ useImageDownloads \} from "\.\/useImageDownloads"/, "History panel should use the download hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const downloads = useImageDownloads\(\)/, "History panel should initialize download state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const hasDownloadableSelection = selectedItems\.some\(\(item\) => Boolean\(item\.resultUrl\)\)/, "Download action should require a selected result URL");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onClick=\{\(\) => void downloads\.downloadCollection\(selectedItems\)\}[\s\S]*disabled=\{!hasDownloadableSelection \|\| downloads\.downloading\}[\s\S]*loading=\{downloads\.downloading\}/, "Download button should be disabled without downloadable selection and show loading");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /下载集合/, "History panel should expose a download collection action");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /downloads\.downloadFeedback[\s\S]*aria-live="polite"/, "Download feedback should be announced");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /downloads\.downloadFailures\.length > 0/, "History panel should render fallback links when direct download fails");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-download-fallback"/, "Fallback links should have a stable style hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /downloads\.downloadFailures\.map/, "Fallback links should list each failed item");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /target="_blank" rel="noreferrer"/, "Fallback links should open safely in a new tab");

  assertContains("src/styles/pages.css", /\.image-download-feedback\s*\{/, "Download feedback should have dedicated styles");
  assertContains("src/styles/pages.css", /\.image-download-fallback\s*\{[\s\S]*display:\s*grid;/, "Fallback link panel should be structured");
  assertContains("src/styles/pages.css", /\.image-download-fallback__links\s*\{[\s\S]*display:\s*grid;/, "Fallback links should have a dedicated list style");
  assertContains("src/styles/pages.css", /\.image-download-fallback__links a\s*\{[\s\S]*overflow-wrap:\s*anywhere;/, "Fallback links should wrap long URLs safely");

  assertContains("package.json", /"test:image-download-collection":\s*"node scripts\/verify-image-download-collection\.mjs"/, "package script should expose the I06 verifier");
  assertContains("../docs/tasks.md", /\| I06 \| 已完成 \|[\s\S]*useImageDownloads[\s\S]*有选中项才可操作[\s\S]*下载中有 loading[\s\S]*跨域失败时显示可打开链接列表/, "docs/tasks.md should record I06 completion and fallback behavior");
}

try {
  main();
  console.log("Image download collection verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
