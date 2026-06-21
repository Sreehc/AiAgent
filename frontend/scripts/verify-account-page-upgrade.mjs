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
  assertContains("src/pages/AccountPage.tsx", /account-summary-grid/, "Account page should expose a structured account summary grid");
  assertContains("src/pages/AccountPage.tsx", /account-layout/, "Account page should use a dedicated account layout");
  assertContains("src/pages/AccountPage.tsx", /account-section-nav/, "Account page should provide section navigation for profile, API, security, and logs");
  assertContains("src/pages/AccountPage.tsx", /account-status-alerts/, "Account page should unify success and error feedback");
  assertContains("src/pages/AccountPage.tsx", /renderAccountSummary/, "Account summary should be rendered through a dedicated helper");
  assertContains("src/pages/AccountPage.tsx", /renderAccountStatusAlerts/, "Account alerts should be rendered through a dedicated helper");
  assertContains("src/pages/AccountPage.tsx", /activeApiTest/, "API config tests should track which model type is currently testing");
  assertContains("src/pages/AccountPage.tsx", /lastApiTestResult/, "API config tests should preserve the latest test result");
  assertContains("src/pages/AccountPage.tsx", /profileError[\s\S]*passwordError[\s\S]*apiConfigError/, "Error feedback should include profile, password, and API config");
  assertContains("src/pages/AccountPage.tsx", /profileSuccess[\s\S]*passwordMessage[\s\S]*apiConfigMessage/, "Success feedback should include profile, password, and API config");

  assertContains("src/features/account/ApiConfigForm.tsx", /account-api-card/, "API config form should have a dedicated visual section");
  assertContains("src/features/account/ApiConfigForm.tsx", /testState/, "API config form should receive per-test state");
  assertContains("src/features/account/ApiConfigForm.tsx", /lastTestResult/, "API config form should display the latest test result");
  assertContains("src/features/account/ApiConfigForm.tsx", /测试 Chat[\s\S]*测试 Embedding[\s\S]*测试 Image/, "API config form should keep all provider test actions");
  assertContains("src/features/account/ApiConfigForm.tsx", /Alert tone=\{lastTestResult\.status === "SUCCESS" \? "success" : "error"\}/, "API test result should use consistent Alert feedback");

  assertContains("src/features/account/ProfileForm.tsx", /account-profile-card/, "Profile form should have a dedicated visual section");
  assertContains("src/features/account/ProfileForm.tsx", /error: string \| null/, "Profile form should accept profile errors inline");
  assertContains("src/features/account/ProfileForm.tsx", /Alert tone="error"/, "Profile form should display error feedback consistently");

  assertContains("src/features/account/SecurityForm.tsx", /account-security-card/, "Security form should have a dedicated visual section");
  assertContains("src/features/account/SecurityForm.tsx", /description="至少 8 位/, "Security form should document the password rule");

  assertContains("src/features/account/LoginLogTable.tsx", /account-login-log-table/, "Login log table should expose a stable table class");
  assertContains("src/features/account/LoginLogTable.tsx", /TableEmpty/, "Login log table should use shared empty table state");
  assertContains("src/features/account/LoginLogTable.tsx", /时间[\s\S]*IP[\s\S]*User Agent[\s\S]*结果/, "Login log table should use readable structured columns");
  assertContains("src/features/account/LoginLogTable.tsx", /formatLoginDate/, "Login log table should format login timestamps consistently");

  assertContains("src/styles/pages.css", /\.account-summary-grid\s*\{/, "Account summary should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-summary-card\s*\{/, "Account summary cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-layout\s*\{/, "Account layout should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-section-nav\s*\{/, "Account section nav should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-status-alerts\s*\{/, "Account status alerts should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-login-log-table\s*\{/, "Account login log table should have dedicated styles");

  assertContains("package.json", /"test:account-page-upgrade":\s*"node scripts\/verify-account-page-upgrade\.mjs"/, "package script should expose the A06 verifier");
  assertContains("../docs/tasks.md", /\| A06 \| 已完成 \|[\s\S]*AccountPage[\s\S]*个人 API、资料、安全、登录日志[\s\S]*保存、测试、错误、成功反馈一致/, "docs/tasks.md should record A06 completion");
}

try {
  main();
  console.log("Account page upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
