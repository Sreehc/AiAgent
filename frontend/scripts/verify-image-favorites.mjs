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
  assertContains("src/features/image/useImageFavorites.ts", /export const IMAGE_FAVORITES_STORAGE_KEY = "aiagent:image-favorites:v1"/, "Favorites should use a stable localStorage key");
  assertContains("src/features/image/useImageFavorites.ts", /type ImageFavoriteStorage = Pick<Storage, "getItem" \| "setItem">/, "Favorites helper should accept a narrow storage adapter");
  assertContains("src/features/image/useImageFavorites.ts", /export function readImageFavoriteIds\(storage: ImageFavoriteStorage \| null = getImageFavoriteStorage\(\)\)/, "Favorites should expose a storage reader for tests and reuse");
  assertContains("src/features/image/useImageFavorites.ts", /JSON\.parse\(raw\)[\s\S]*Array\.isArray/, "Favorites reader should parse JSON arrays safely");
  assertContains("src/features/image/useImageFavorites.ts", /catch[\s\S]*return \[\]/, "Favorites reader should fall back to an empty list on bad storage data");
  assertContains("src/features/image/useImageFavorites.ts", /export function persistImageFavoriteIds\(favoriteIds: string\[\], storage: ImageFavoriteStorage \| null = getImageFavoriteStorage\(\)\)/, "Favorites should expose a storage writer for persistence");
  assertContains("src/features/image/useImageFavorites.ts", /storage\.setItem\(IMAGE_FAVORITES_STORAGE_KEY, JSON\.stringify\(Array\.from\(new Set\(favoriteIds\)\)\)\)/, "Favorites writer should de-duplicate ids before persisting");
  assertContains("src/features/image/useImageFavorites.ts", /catch[\s\S]*return false/, "Favorites writer should report storage failures without throwing");
  assertContains("src/features/image/useImageFavorites.ts", /export function useImageFavorites\(\)/, "Favorites state should live in a dedicated hook");
  assertContains("src/features/image/useImageFavorites.ts", /const \[favoriteIds, setFavoriteIds\] = useState<string\[\]>\(\(\) => readImageFavoriteIds\(\)\)/, "Favorites hook should initialize from localStorage so refresh keeps state");
  assertContains("src/features/image/useImageFavorites.ts", /const \[favoriteFeedback, setFavoriteFeedback\] = useState<string \| null>\(null\)/, "Favorites hook should expose user feedback");
  assertContains("src/features/image/useImageFavorites.ts", /function toggleFavorite\(jobId: string\)/, "Favorites hook should toggle an image id");
  assertContains("src/features/image/useImageFavorites.ts", /persistImageFavoriteIds\(next\)/, "Toggling favorites should persist the next collection");
  assertContains("src/features/image/useImageFavorites.ts", /setFavoriteFeedback\(next\.includes\(jobId\) \? "已加入收藏" : "已取消收藏"\)/, "Successful favorite changes should provide feedback");
  assertContains("src/features/image/useImageFavorites.ts", /setFavoriteFeedback\("无法保存收藏，已保留本页临时状态"\)/, "Storage failures should provide a recoverable feedback message");
  assertContains("src/features/image/useImageFavorites.ts", /function isFavorite\(jobId: string\)/, "Favorites hook should expose per-card lookup");

  assertContains("src/features/image/ImageHistoryPanel.tsx", /import \{ Heart \} from "lucide-react"/, "History cards should use a familiar heart icon for favorites");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /import \{ useImageFavorites \} from "\.\/useImageFavorites"/, "History panel should use the dedicated favorites hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /const favorites = useImageFavorites\(\)/, "History panel should initialize favorite state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /favorites\.favoriteCount\} 收藏/, "History toolbar should display favorite count");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /aria-live="polite"[\s\S]*favorites\.favoriteFeedback/, "Favorite operations should announce feedback");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /favorite=\{favorites\.isFavorite\(item\.jobId\)\}/, "Cards should receive favorite state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /onToggleFavorite=\{favorites\.toggleFavorite\}/, "Cards should receive favorite toggler");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /data-favorite=\{favorite \|\| undefined\}/, "Favorite cards should expose favorite state for styling");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /aria-pressed=\{favorite\}/, "Favorite action should expose pressed state");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /className="image-card__favorite-button"/, "Favorite action should have a stable style hook");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /<Heart[\s\S]*aria-hidden="true"/, "Favorite action should render the heart icon accessibly");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /favorite \? "取消收藏" : "收藏图片"/, "Favorite action should have clear labels");
  assertContains("src/features/image/ImageHistoryPanel.tsx", /favorite \? <Badge tone="primary">已收藏<\/Badge> : null/, "Favorite cards should show a visible favorite badge");

  assertContains("src/styles/pages.css", /\.image-card\[data-favorite="true"\]\s*\{[\s\S]*border-color:\s*color-mix\(in srgb,\s*var\(--color-primary\)/, "Favorite cards should have a primary-accented edge");
  assertContains("src/styles/pages.css", /\.image-card__favorite-button\s*\{[\s\S]*position:\s*absolute;/, "Favorite button should be positioned over the thumbnail");
  assertContains("src/styles/pages.css", /\.image-card__favorite-button\[aria-pressed="true"\]\s*\{[\s\S]*background:\s*var\(--color-primary\)/, "Pressed favorite button should be visually distinct");
  assertContains("src/styles/pages.css", /\.image-history-feedback\s*\{/, "Favorite feedback should have dedicated styles");

  assertContains("package.json", /"test:image-favorites":\s*"node scripts\/verify-image-favorites\.mjs"/, "package script should expose the I04 verifier");
  assertContains("../docs/tasks.md", /\| I04 \| 已完成 \|[\s\S]*收藏状态刷新后保留[\s\S]*无后端依赖[\s\S]*收藏操作有反馈/, "docs/tasks.md should record I04 completion and scope");
}

try {
  main();
  console.log("Image favorites verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
