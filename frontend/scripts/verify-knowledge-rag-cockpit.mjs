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
  assertContains("src/pages/KnowledgeBasesPage.tsx", /className="page page--knowledge"/, "Knowledge page should expose a dedicated page modifier");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /className="knowledge-cockpit"/, "Knowledge page should use a RAG cockpit shell");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /className="knowledge-cockpit__rail"/, "Knowledge page should have a dedicated KB rail");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /className="knowledge-cockpit__main"/, "Knowledge page should have a dedicated main RAG cockpit region");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /aria-label="RAG cockpit"/, "Main region should be labelled as the RAG cockpit");
  assertNotContains("src/pages/KnowledgeBasesPage.tsx", /<div className="content-grid">/, "Knowledge page should no longer rely on the generic content-grid layout");

  assertContains("src/pages/KnowledgeBasesPage.tsx", /const \[loadingDocuments, setLoadingDocuments\] = useState\(false\)/, "Knowledge page should track document loading separately from KB loading");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /setLoadingDocuments\(true\)/, "Document loading should start before fetching documents");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /setLoadingDocuments\(false\)/, "Document loading should stop after fetching documents");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /const cockpitStats = useMemo/, "Knowledge page should centralize cockpit summary metrics");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /totalDocuments/, "Cockpit metrics should include total documents");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /chunkCount/, "Cockpit metrics should include chunk counts");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /failedDocuments/, "Cockpit metrics should include failed document count");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /<KnowledgeBaseSummary[\s\S]*documents=\{documents\}[\s\S]*searchHitCount=\{searchHits\.length\}[\s\S]*loading=\{loading \|\| loadingDocuments\}/, "Summary should receive document and search metrics plus loading state");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /<DocumentTable[\s\S]*loading=\{loadingDocuments\}/, "Document table should receive document loading state");
  assertContains("src/pages/KnowledgeBasesPage.tsx", /<SearchTestPanel[\s\S]*hasSearched=\{hasSearched\}/, "Search panel should distinguish initial and no-result states");

  assertContains("src/features/knowledge/KnowledgeBaseList.tsx", /className="knowledge-rail"/, "KnowledgeBaseList should expose rail styling hook");
  assertContains("src/features/knowledge/KnowledgeBaseList.tsx", /aria-label="知识库管理"/, "KnowledgeBaseList rail should be labelled");
  assertContains("src/features/knowledge/KnowledgeBaseList.tsx", /className="knowledge-rail__create"/, "Create form should be a clear rail section");
  assertContains("src/features/knowledge/KnowledgeBaseList.tsx", /className="knowledge-rail__list"/, "KB list should be a clear rail section");
  assertContains("src/features/knowledge/KnowledgeBaseList.tsx", /className=\{`knowledge-base-item/, "KB rows should use a dedicated item hook");

  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /KnowledgeDocumentItem/, "Summary should accept document data for cockpit metrics");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /searchHitCount/, "Summary should show search hit count");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /className="knowledge-summary"/, "Summary should expose a dedicated style hook");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /className="knowledge-summary-grid"/, "Summary metrics should be visually grouped");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /Skeleton/, "Summary should render loading feedback");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /indexedDocuments/, "Summary should derive indexed document count");
  assertContains("src/features/knowledge/KnowledgeBaseSummary.tsx", /failedDocuments/, "Summary should derive failed document count");

  assertContains("src/features/knowledge/DocumentTable.tsx", /loading:\s*boolean/, "Document table should accept a loading prop");
  assertContains("src/features/knowledge/DocumentTable.tsx", /className="rag-document-panel"/, "Document table should expose a RAG document panel hook");
  assertContains("src/features/knowledge/DocumentTable.tsx", /state=\{loading \? "loading"/, "Document panel should expose loading state semantics");
  assertContains("src/features/knowledge/DocumentTable.tsx", /TableLoading/, "Document table should render table loading rows");
  assertContains("src/features/knowledge/DocumentTable.tsx", /title="选择知识库"/, "Document table should show a clear empty state when no KB is selected");

  assertContains("src/features/knowledge/SearchTestPanel.tsx", /hasSearched:\s*boolean/, "Search panel should accept hasSearched");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="rag-search-panel"/, "Search panel should expose a RAG search panel hook");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /disabled=\{!selected\}/, "Search input should be disabled when no KB is selected");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /Skeleton/, "Search panel should render loading feedback");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /hasSearched && hits\.length === 0/, "Search panel should show a no-results state after an empty search");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="rag-search-results"/, "Search results should have a stable results hook");
  assertContains("src/features/knowledge/SearchTestPanel.tsx", /className="search-hit-card"/, "Search hit items should use a dedicated card hook");

  assertContains("src/styles/pages.css", /\.page--knowledge/, "Knowledge page should have page-level styles");
  assertContains("src/styles/pages.css", /\.knowledge-cockpit\s*\{[\s\S]*grid-template-columns:\s*300px minmax\(0,\s*1fr\)/, "Knowledge cockpit should use a desktop rail/main layout");
  assertContains("src/styles/pages.css", /\.knowledge-cockpit__rail\s*\{[\s\S]*position:\s*sticky;/, "KB rail should stay anchored on desktop");
  assertContains("src/styles/pages.css", /\.knowledge-summary-grid\s*\{[\s\S]*display:\s*grid;/, "Summary metrics should use a grid");
  assertContains("src/styles/pages.css", /\.rag-document-panel/, "Document panel should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-search-panel/, "Search panel should have dedicated styles");
  assertContains("src/styles/pages.css", /\.search-hit-card/, "Search result cards should have dedicated styles");
  assertContains("src/styles/pages.css", /@media \(max-width: 1100px\)[\s\S]*\.knowledge-cockpit\s*\{[\s\S]*grid-template-columns:\s*1fr;/, "Knowledge cockpit should collapse to one column on smaller screens");

  assertContains("package.json", /"test:knowledge-rag-cockpit":\s*"node scripts\/verify-knowledge-rag-cockpit\.mjs"/, "package script should expose the K01 verifier");
}

try {
  main();
  console.log("Knowledge RAG cockpit verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
