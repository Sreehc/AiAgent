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
  assertContains("src/pages/AdminAuditPage.tsx", /Table,\s*TableBody,\s*TableCell,\s*TableEmpty,\s*TableExpandedRow,\s*TableHead,\s*TableHeader,\s*TableLoading,\s*TableRow/, "Audit page should use the shared structured table components");
  assertContains("src/pages/AdminAuditPage.tsx", /const auditColumnPresets: Record<AuditTab, AuditColumn\[\]>/, "Audit page should define per-tab structured columns");
  assertContains("src/pages/AdminAuditPage.tsx", /users:\s*\[[\s\S]*时间[\s\S]*用户[\s\S]*动作[\s\S]*目标对象[\s\S]*结果[\s\S]*IP/, "User audit columns should match priority fields");
  assertContains("src/pages/AdminAuditPage.tsx", /runs:\s*\[[\s\S]*时间[\s\S]*用户[\s\S]*会话\/Run[\s\S]*任务标题[\s\S]*执行模式[\s\S]*状态[\s\S]*耗时[\s\S]*错误摘要[\s\S]*工具调用数[\s\S]*产物数/, "Run audit columns should match priority fields");
  assertContains("src/pages/AdminAuditPage.tsx", /tools:\s*\[[\s\S]*时间[\s\S]*服务[\s\S]*工具名[\s\S]*关联 Run[\s\S]*状态[\s\S]*耗时[\s\S]*错误类型[\s\S]*输入摘要[\s\S]*输出摘要/, "Tool audit columns should match priority fields");
  assertContains("src/pages/AdminAuditPage.tsx", /logins:\s*\[[\s\S]*时间[\s\S]*用户[\s\S]*IP[\s\S]*User Agent[\s\S]*结果[\s\S]*失败原因/, "Login audit columns should match priority fields");
  assertContains("src/pages/AdminAuditPage.tsx", /const \[expandedRowKey, setExpandedRowKey\] = useState<string \| null>\(null\)/, "Audit page should track expanded row details");
  assertContains("src/pages/AdminAuditPage.tsx", /function renderAuditTable\(/, "Audit page should render a structured table");
  assertContains("src/pages/AdminAuditPage.tsx", /audit-table/, "Audit table should expose a stable class");
  assertContains("src/pages/AdminAuditPage.tsx", /audit-table-cell/, "Audit table cells should expose stable classes");
  assertContains("src/pages/AdminAuditPage.tsx", /audit-detail-grid/, "Expanded details should use a structured detail grid");
  assertContains("src/pages/AdminAuditPage.tsx", /TableLoading columns=\{columns\.length \+ 1\}/, "Audit table should use shared loading rows");
  assertContains("src/pages/AdminAuditPage.tsx", /TableEmpty colSpan=\{columns\.length \+ 1\}/, "Audit table should use shared empty rows");
  assertContains("src/pages/AdminAuditPage.tsx", /TableExpandedRow colSpan=\{columns\.length \+ 1\}/, "Audit table should use shared expanded rows");
  assertContains("src/pages/AdminAuditPage.tsx", /JsonBlock payload=\{row\} label="原始审计 payload"/, "Expanded detail should keep raw payload fallback");
  assertContains("src/pages/AdminAuditPage.tsx", /StatusPill status=\{getAuditStatus\(row\)\}/, "Status/result fields should use StatusPill");
  assertContains("src/pages/AdminAuditPage.tsx", /formatAuditDuration/, "Duration should be formatted for scanability");
  assertContains("src/pages/AdminAuditPage.tsx", /formatAuditDate/, "Date fields should be formatted for scanability");
  assertContains("src/pages/AdminAuditPage.tsx", /readFirst\(row, column\.keys\)/, "Column values should gracefully read fallback fields");
  assertContains("src/pages/AdminAuditPage.tsx", /setExpandedRowKey\(expandedRowKey === rowKey \? null : rowKey\)/, "Rows should toggle expanded details");

  assertContains("src/styles/pages.css", /\.audit-table\s*\{/, "Audit table should have dedicated styles");
  assertContains("src/styles/pages.css", /\.audit-table-cell\s*\{/, "Audit cells should have dedicated styles");
  assertContains("src/styles/pages.css", /\.audit-table-cell--wide\s*\{/, "Wide audit cells should have dedicated styles");
  assertContains("src/styles/pages.css", /\.audit-detail-grid\s*\{/, "Audit detail grid should have dedicated styles");
  assertContains("src/styles/pages.css", /\.audit-detail-grid__item\s*\{/, "Audit detail fields should have dedicated styles");

  assertContains("package.json", /"test:audit-structured-table":\s*"node scripts\/verify-audit-structured-table\.mjs"/, "package script should expose the A04 verifier");
  assertContains("../docs/tasks.md", /\| A04 \| 已完成 \|[\s\S]*AdminAuditPage[\s\S]*用户、任务、工具、登录 tab 按 `spec\.md` 字段展示[\s\S]*详情可展开原始 payload/, "docs/tasks.md should record A04 completion");
}

try {
  main();
  console.log("Audit structured table verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
