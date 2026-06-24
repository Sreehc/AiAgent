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
  assertContains("src/features/auth/AuthLayout.tsx", /import \{ Badge, Panel \} from "\.\.\/\.\.\/components\/ui"/, "AuthLayout should reuse shared Panel and Badge components");
  assertContains("src/features/auth/AuthLayout.tsx", /<Panel[\s\S]*variant="raised"[\s\S]*className="auth-card"/, "Auth form should render in a raised Panel");
  assertContains("src/features/auth/AuthLayout.tsx", /auth-status-strip/, "AuthLayout should show a compact system status strip");
  assertContains("src/features/auth/AuthLayout.tsx", /auth-capability-list/, "AuthLayout should render compact capability chips/list");
  assertContains("src/features/auth/AuthLayout.tsx", /aria-label="认证表单"/, "Auth form panel should be labelled for accessibility");
  assertContains("src/features/auth/AuthLayout.tsx", /auth-card__body/, "Auth card body should provide stable styling hooks");

  assertContains("src/pages/LoginPage.tsx", /className="auth-form"/, "Login form should use the shared auth-form layout");
  assertContains("src/pages/LoginPage.tsx", /title="登录失败"/, "Login errors should have a clear alert title");
  assertContains("src/pages/LoginPage.tsx", /size="lg"[\s\S]*fullWidth/, "Login submit should use the large full-width auth action");
  assertContains("src/pages/LoginPage.tsx", /required/, "Login fields should keep browser-level required validation");

  assertContains("src/pages/RegisterPage.tsx", /className="auth-form"/, "Register form should use the shared auth-form layout");
  assertNotContains("src/pages/RegisterPage.tsx", /className="form-row"/, "Register form should be single-column, not double-column");
  assertContains("src/pages/RegisterPage.tsx", /variant="permission"/, "Invalid invite notice should use the permission empty state");
  assertContains("src/pages/RegisterPage.tsx", /title="注册失败"/, "Register errors should have a clear alert title");
  assertContains("src/pages/RegisterPage.tsx", /title="注册成功"/, "Register success should have a clear alert title");
  assertContains("src/pages/RegisterPage.tsx", /disabled=\{submitting \|\| Boolean\(success\)\}/, "Register success should disable repeat submission before redirect");
  assertContains("src/pages/RegisterPage.tsx", /size="lg"[\s\S]*fullWidth/, "Register submit should use the large full-width auth action");

  assertContains("src/pages/ForgotPasswordPage.tsx", /className="auth-form"/, "Forgot password form should use the shared auth-form layout");
  assertContains("src/pages/ForgotPasswordPage.tsx", /title="找回失败"/, "Forgot password errors should have a clear alert title");
  assertContains("src/pages/ForgotPasswordPage.tsx", /title="请求已记录"/, "Forgot password success should have a clear alert title");
  assertContains("src/pages/ForgotPasswordPage.tsx", /variant="first-run"/, "Reset token helper should use a first-run empty state");
  assertContains("src/pages/ForgotPasswordPage.tsx", /size="lg"[\s\S]*fullWidth/, "Forgot password submit should use the large full-width auth action");

  assertContains("src/pages/ResetPasswordPage.tsx", /className="auth-form"/, "Reset password form should use the shared auth-form layout");
  assertContains("src/pages/ResetPasswordPage.tsx", /newPassword\.length < 8/, "Reset password should validate minimum password length before API call");
  assertContains("src/pages/ResetPasswordPage.tsx", /title="重置失败"/, "Reset errors should have a clear alert title");
  assertContains("src/pages/ResetPasswordPage.tsx", /title="密码已重置"/, "Reset success should have a clear alert title");
  assertContains("src/pages/ResetPasswordPage.tsx", /disabled=\{submitting \|\| Boolean\(success\)\}/, "Reset success should disable repeat submission");
  assertContains("src/pages/ResetPasswordPage.tsx", /size="lg"[\s\S]*fullWidth/, "Reset submit should use the large full-width auth action");

  assertContains("src/styles/pages.css", /\.auth-page::before/, "Auth background should include a restrained grid/line treatment");
  assertContains("src/styles/pages.css", /\.auth-card\s*\{[\s\S]*border-radius:\s*12px;/, "Auth raised panel radius should stay within the 12px spec");
  assertContains("src/styles/pages.css", /\.auth-form\s*\{[\s\S]*display:\s*grid;/, "Auth forms should use a stable grid layout");
  assertContains("src/styles/pages.css", /\.auth-status-strip/, "Auth status strip should be styled");
  assertContains("src/styles/pages.css", /\.auth-capability-list/, "Auth capability list/chips should be styled");
  assertContains("src/styles/pages.css", /@media \(max-width: 560px\)[\s\S]*\.auth-capability-list/, "Mobile auth layout should reduce capability noise");

  assertContains("package.json", /"test:auth-pages":\s*"node scripts\/verify-auth-pages\.mjs"/, "package script should expose the S02 verifier");
}

try {
  main();
  console.log("Auth pages verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
