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
  assertContains("src/pages/ImageGenerationPage.tsx", /className="page page--image-studio"/, "Image studio should expose a dedicated page modifier");
  assertContains("src/pages/ImageGenerationPage.tsx", /const imageStudioStats = useMemo/, "Image studio should derive header stats from current form/history/latest result");
  assertContains("src/pages/ImageGenerationPage.tsx", /className="image-studio-layout"/, "Image studio should use a dedicated controls/main layout");
  assertContains("src/pages/ImageGenerationPage.tsx", /className="image-studio-layout__controls"/, "Image studio should expose a controls rail");
  assertContains("src/pages/ImageGenerationPage.tsx", /className="image-studio-layout__main"/, "Image studio should expose a main preview/history region");
  assertContains("src/pages/ImageGenerationPage.tsx", /const \[generationError, setGenerationError\] = useState<string \| null>\(null\)/, "Image generation failures should be tracked separately from history/session loading errors");
  assertContains("src/pages/ImageGenerationPage.tsx", /<ImageGallery[\s\S]*submitting=\{submitting\}[\s\S]*error=\{generationError\}/, "Latest output stage should receive submitting and generation error state");
  assertContains("src/pages/ImageGenerationPage.tsx", /setGenerationError\(\(requestError as ApiError\)\.message\)/, "Submit failures should drive the preview error placeholder");
  assertContains("src/pages/ImageGenerationPage.tsx", /<ImageHistoryPanel[\s\S]*className="image-history-section"/, "History section should be separated from the preview stage");
  assertNotContains("src/pages/ImageGenerationPage.tsx", /content-grid content-grid--wide-side/, "Image studio should no longer use the generic content grid");

  assertContains("src/features/image/ImageGenerationForm.tsx", /className="image-controls-panel"/, "Generation controls should expose a stable panel hook");
  assertContains("src/features/image/ImageGenerationForm.tsx", /className="image-generation-form"/, "Generation form should expose a dedicated form hook");
  assertContains("src/features/image/ImageGenerationForm.tsx", /className="image-generation-form__mode"/, "Mode segmented control should be visually addressable");
  assertContains("src/features/image/ImageGenerationForm.tsx", /className="image-generation-form__action"/, "Generate action should stay visually prominent");
  assertContains("src/features/image/ImageGenerationForm.tsx", /disabled=\{submitting\}/, "Reference upload should be disabled while submitting");

  assertContains("src/features/image/ImageGallery.tsx", /submitting:\s*boolean/, "ImageGallery should accept submitting state");
  assertContains("src/features/image/ImageGallery.tsx", /error:\s*string \| null/, "ImageGallery should accept generation error state");
  assertContains("src/features/image/ImageGallery.tsx", /const \[imageLoadFailed, setImageLoadFailed\] = useState\(false\)/, "Latest preview should track image load failure");
  assertContains("src/features/image/ImageGallery.tsx", /useEffect\(\(\) => \{[\s\S]*setImageLoadFailed\(false\)/, "Latest preview should reset load failure when result changes");
  assertContains("src/features/image/ImageGallery.tsx", /className=\{`image-stage image-stage--\$\{stageState\}`\}/, "Latest preview should expose stage state");
  assertContains("src/features/image/ImageGallery.tsx", /className="image-stage__placeholder"/, "Preview stage should show a stable placeholder");
  assertContains("src/features/image/ImageGallery.tsx", /className="image-stage__error"/, "Preview stage should show image or generation errors");
  assertContains("src/features/image/ImageGallery.tsx", /onError=\{\(\) => setImageLoadFailed\(true\)\}/, "Latest preview image should fall back on load error");
  assertContains("src/features/image/ImageGallery.tsx", /result\.createdAt/, "Latest preview metadata should include creation time");
  assertContains("src/features/image/ImageGallery.tsx", /result\.size/, "Latest preview metadata should include size");
  assertContains("src/features/image/ImageGallery.tsx", /result\.sessionId/, "Latest preview metadata should include session association");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-history-panel"/, "History panel should expose a dedicated hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-history-toolbar"/, "History panel should have a toolbar region");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-history-grid"/, "History thumbnails should use a dedicated grid");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /function ImageHistoryCard\(\{ item \}: \{ item: ImageHistoryItem \}\)/, "History items should render through a focused card component");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const \[imageLoadFailed, setImageLoadFailed\] = useState\(false\)/, "History thumbnails should track image load failure");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onError=\{\(\) => setImageLoadFailed\(true\)\}/, "History thumbnail image should fall back on load error");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__placeholder"/, "History cards should render a placeholder for missing or failed images");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /item\.errorMessage \?\? "图片预览加载失败"/, "History image failure should show a clear reason");

  assertContains("src/styles/pages.css", /\.page--image-studio/, "Image studio should have page-level styles");
  assertContains("src/styles/pages.css", /\.image-studio-layout\s*\{[\s\S]*grid-template-columns:\s*340px minmax\(0,\s*1fr\)/, "Image studio should use a desktop controls/main layout");
  assertContains("src/styles/pages.css", /\.image-studio-layout__controls\s*\{[\s\S]*position:\s*sticky;/, "Controls rail should stay anchored on desktop");
  assertContains("src/styles/pages.css", /\.image-controls-panel/, "Generation controls should have dedicated styles");
  assertContains("src/styles/pages.css", /\.image-generation-form__action/, "Generation action should have dedicated styles");
  assertContains("src/styles/pages.css", /\.image-stage--loading/, "Latest preview should style loading state");
  assertContains("src/styles/pages.css", /\.image-stage__placeholder/, "Latest preview placeholder should be styled");
  assertContains("src/styles/pages.css", /\.image-stage__error/, "Latest preview error placeholder should be styled");
  assertContains("src/styles/pages.css", /\.image-history-toolbar/, "History toolbar should be styled");
  assertContains("src/styles/pages.css", /\.image-history-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(180px,\s*1fr\)\)/, "History grid should use dense thumbnail tracks");
  assertContains("src/styles/pages.css", /@media \(max-width: 1100px\)[\s\S]*\.image-studio-layout\s*\{[\s\S]*grid-template-columns:\s*1fr;/, "Image studio layout should collapse to one column");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.image-history-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/, "History grid should become two columns on mobile");

  assertContains("package.json", /"test:image-studio-layout":\s*"node scripts\/verify-image-studio-layout\.mjs"/, "package script should expose the I01 verifier");
}

try {
  main();
  console.log("Image studio layout verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
