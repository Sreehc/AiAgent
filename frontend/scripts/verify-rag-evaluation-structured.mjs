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
  assertContains("src/pages/RagEvaluationPage.tsx", /Table,\s*TableBody,\s*TableCell,\s*TableEmpty,\s*TableExpandedRow,\s*TableHead,\s*TableHeader,\s*TableLoading,\s*TableRow/, "RAG evaluation page should use the shared structured table components");
  assertContains("src/pages/RagEvaluationPage.tsx", /StatusPill/, "Evaluation status should use StatusPill semantics");
  assertContains("src/pages/RagEvaluationPage.tsx", /const \[expandedEvalId, setExpandedEvalId\] = useState<string \| null>\(null\)/, "Evaluation history should track expanded detail rows");
  assertContains("src/pages/RagEvaluationPage.tsx", /function parseRagMetrics\(/, "Metrics should be parsed through a dedicated helper");
  assertContains("src/pages/RagEvaluationPage.tsx", /function getMetricValue\(/, "Metric lookup should support stable field fallbacks");
  assertContains("src/pages/RagEvaluationPage.tsx", /function renderMetricCards\(/, "Metrics should render as structured cards");
  assertContains("src/pages/RagEvaluationPage.tsx", /function renderEvaluationHistoryTable\(/, "Evaluation history should render as a structured table");
  assertContains("src/pages/RagEvaluationPage.tsx", /function renderCaseTable\(/, "Evaluation cases should render as a structured table");
  assertContains("src/pages/RagEvaluationPage.tsx", /function renderEvaluationDetails\(/, "Expanded rows should render structured evaluation details");

  assertContains("src/pages/RagEvaluationPage.tsx", /rag-evaluation-summary/, "Page should expose a summary metrics region");
  assertContains("src/pages/RagEvaluationPage.tsx", /rag-metric-card/, "Metric cards should have stable styles");
  assertContains("src/pages/RagEvaluationPage.tsx", /rag-evaluation-table/, "Evaluation history table should expose a stable class");
  assertContains("src/pages/RagEvaluationPage.tsx", /rag-case-table/, "Case table should expose a stable class");
  assertContains("src/pages/RagEvaluationPage.tsx", /rag-detail-grid/, "Expanded detail should use a structured detail grid");
  assertContains("src/pages/RagEvaluationPage.tsx", /rag-metrics-parse-warning/, "Metrics parse failure should have a stable warning class");

  assertContains("src/pages/RagEvaluationPage.tsx", /Eval ID[\s\S]*状态[\s\S]*Top K[\s\S]*知识库[\s\S]*用例[\s\S]*通过\/失败[\s\S]*主要指标[\s\S]*创建时间/, "Evaluation history columns should match priority fields");
  assertContains("src/pages/RagEvaluationPage.tsx", /Query[\s\S]*启用[\s\S]*期望 citation[\s\S]*期望文本[\s\S]*最近结果[\s\S]*失败原因/, "Case columns should match priority fields");
  assertContains("src/pages/RagEvaluationPage.tsx", /Hit Rate[\s\S]*Recall[\s\S]*Precision[\s\S]*MRR[\s\S]*NDCG/, "Metric detail should include priority metric labels");
  assertContains("src/pages/RagEvaluationPage.tsx", /失败用例/, "Metric detail should include failed cases");
  assertContains("src/pages/RagEvaluationPage.tsx", /JsonBlock payload=\{item\.metrics\} label="原始 metrics"/, "Raw metrics should remain available through JsonBlock fallback");
  assertContains("src/pages/RagEvaluationPage.tsx", /JsonBlock payload=\{item\.cases\} label="原始评估用例"/, "Raw cases should remain available through JsonBlock fallback");
  assertContains("src/pages/RagEvaluationPage.tsx", /metrics\.parseError/, "Metrics parse failure should be surfaced");

  assertContains("src/styles/pages.css", /\.rag-evaluation-summary\s*\{/, "RAG summary should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-metric-card\s*\{/, "RAG metric cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-evaluation-table\s*\{/, "RAG evaluation table should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-case-table\s*\{/, "RAG case table should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-detail-grid\s*\{/, "RAG detail grid should have dedicated styles");
  assertContains("src/styles/pages.css", /\.rag-metrics-parse-warning\s*\{/, "Metrics parse warning should have dedicated styles");

  assertContains("package.json", /"test:rag-evaluation-structured":\s*"node scripts\/verify-rag-evaluation-structured\.mjs"/, "package script should expose the A05 verifier");
  assertContains("../docs/tasks.md", /\| A05 \| 已完成 \|[\s\S]*RagEvaluationPage[\s\S]*可解析 metrics 优先结构化[\s\S]*解析失败时展示原始 metrics 详情/, "docs/tasks.md should record A05 completion");
}

try {
  main();
  console.log("RAG evaluation structured verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
