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
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /function SearchEvidenceCard\(\{ hit \}: \{ hit: SearchHit \}\)/, "Search hits should render through a dedicated evidence card component");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /hits\.map\(\(hit\) => <SearchEvidenceCard key=\{hit\.chunkId\} hit=\{hit\} \/>/, "Search results should delegate each hit to SearchEvidenceCard");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /aria-label=\{`检索命中 #\$\{hit\.rank\}`\}/, "Evidence cards should expose a clear per-hit aria label");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /data-rank=\{hit\.rank\}/, "Evidence cards should expose rank as stable data for tests and inspection");

  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="search-hit-card__rank"[\s\S]*<span>Rank<\/span>[\s\S]*hit\.rank/, "Evidence cards should show rank with an explicit label");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="search-hit-card__score"[\s\S]*<span>Score<\/span>[\s\S]*hit\.score\.toFixed\(4\)/, "Evidence cards should show score with stable precision and label");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /<span>文件名<\/span>[\s\S]*hit\.fileName/, "Evidence cards should show file name as a structured field");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /<span>Citation<\/span>[\s\S]*title=\{hit\.citationId\}/, "Evidence cards should show citation with full value available on hover");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /<span>Section<\/span>[\s\S]*hit\.sectionTitle \?\? "未标注"/, "Evidence cards should show section with an empty fallback");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /<span>Chunk<\/span>[\s\S]*hit\.chunkNo/, "Evidence cards should show chunk number as a structured field");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /<span>策略<\/span>[\s\S]*hit\.retrievalStrategy/, "Evidence cards should show retrieval strategy as a structured field");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="search-hit-card__preview"[\s\S]*hit\.contentPreview/, "Evidence cards should show content preview in a dedicated region");

  assertContains("src/styles/pages.css", /\.search-hit-card__topline\s*\{/, "Evidence cards should style the top rank/source row");
  assertContains("src/styles/pages.css", /\.search-hit-card__metrics\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(140px,\s*1fr\)\)/, "Evidence card fields should use a responsive comparison grid");
  assertContains("src/styles/pages.css", /\.search-hit-card__field\s*\{/, "Evidence card fields should have dedicated styles");
  assertContains("src/styles/pages.css", /\.search-hit-card__preview\s*\{/, "Evidence card previews should have dedicated styles");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.search-hit-card__metrics/, "Evidence card comparison grid should adapt on mobile");

  assertContains("package.json", /"test:search-evidence-cards":\s*"node scripts\/verify-search-evidence-cards\.mjs"/, "package script should expose the K03 verifier");
}

try {
  main();
  console.log("Search evidence card verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
