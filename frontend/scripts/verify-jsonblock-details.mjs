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
  assertContains("src/features/workspace/JsonBlock.tsx", /summary\?:\s*ReactNode/, "JsonBlock should accept a caller-provided summary");
  assertContains("src/features/workspace/JsonBlock.tsx", /payload\?:\s*unknown/, "JsonBlock should accept nullable or non-string payloads");
  assertContains("src/features/workspace/JsonBlock.tsx", /JSON\.parse/, "JsonBlock should attempt to parse structured JSON strings");
  assertContains("src/features/workspace/JsonBlock.tsx", /JSON\.stringify\(parsed,\s*null,\s*2\)/, "Parsed JSON should be pretty printed");
  assertContains("src/features/workspace/JsonBlock.tsx", /结构化解析失败/, "Parse errors should be explicitly labelled");
  assertContains("src/features/workspace/JsonBlock.tsx", /暂无详情数据/, "Empty payloads should show a useful empty state");
  assertContains("src/features/workspace/JsonBlock.tsx", /if \(!displayPayload\)/, "Empty payloads should not render an empty pre block");
  assertContains("src/features/workspace/JsonBlock.tsx", /<details[\s\S]*className=\{cn\("json-block/, "JsonBlock should keep raw payload collapsed by default");
  assertContains("src/features/workspace/JsonBlock.tsx", /<summary[\s\S]*focus-visible:ring-2/, "Summary should expose visible keyboard focus");
  assertContains("src/features/workspace/JsonBlock.tsx", /json-block__summary/, "Summary should include a compact payload summary");
  assertContains("src/features/workspace/JsonBlock.tsx", /ChevronRight/, "Summary should include an expand affordance");
  assertContains("src/features/workspace/JsonBlock.tsx", /surface-inset/, "Expanded payload should use an inset surface");
  assertContains("src/features/workspace/JsonBlock.tsx", /max-h-80 overflow-auto/, "Long payloads should be constrained to 320px and scroll");
  assertContains("src/features/workspace/JsonBlock.tsx", /font-mono/, "Expanded payload should use mono text");

  assertContains("src/pages/AdminAuditPage.tsx", /import \{ JsonBlock \} from "\.\.\/features\/workspace\/JsonBlock"/, "Audit details should reuse JsonBlock");
  assertContains("src/pages/AdminAuditPage.tsx", /payload=\{row\}/, "Audit raw payload should stay in JsonBlock details");
  assertNotContains("src/pages/AdminAuditPage.tsx", /<pre>\{JSON\.stringify\(row,\s*null,\s*2\)\}<\/pre>/, "Audit page should not render raw JSON directly");

  assertContains("src/pages/RagEvaluationPage.tsx", /import \{ JsonBlock \} from "\.\.\/features\/workspace\/JsonBlock"/, "RAG metrics details should reuse JsonBlock");
  assertContains("src/pages/RagEvaluationPage.tsx", /payload=\{item\.metrics\}/, "RAG raw metrics should stay in JsonBlock details");
  assertNotContains("src/pages/RagEvaluationPage.tsx", /<pre>\{item\.metrics\}<\/pre>/, "RAG page should not render raw metrics directly");

  assertContains("package.json", /"test:jsonblock-details":\s*"node scripts\/verify-jsonblock-details\.mjs"/, "package script should expose the C07 verifier");
}

try {
  main();
  console.log("JsonBlock details verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
