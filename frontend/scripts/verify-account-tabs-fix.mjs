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
  assertContains("src/pages/AccountPage.tsx", /type AccountSectionId = "account-api" \| "account-profile" \| "account-security" \| "account-login-logs";/, "Account page should define explicit account section ids");
  assertContains("src/pages/AccountPage.tsx", /const \[activeSection, setActiveSection\] = useState<AccountSectionId>/, "Account page should track the active account section");
  assertContains("src/pages/AccountPage.tsx", /useLocation\(\)/, "Account page should read the current hash from location");
  assertContains("src/pages/AccountPage.tsx", /useNavigate\(\)/, "Account page should update the hash through router navigation");
  assertContains("src/pages/AccountPage.tsx", /<Tabs[\s\S]*onChange=\{\(section\) => handleSectionChange\(section\)\}[\s\S]*>\s*<TabsContent value="account-api"/, "Account navigation should render tab content within the controlled tabs component");
  assertContains("src/pages/AccountPage.tsx", /<TabsContent value="account-profile"/, "Account page should render a dedicated profile tab content");
  assertContains("src/pages/AccountPage.tsx", /<TabsContent value="account-security"/, "Account page should render a dedicated security tab content");
  assertContains("src/pages/AccountPage.tsx", /<TabsContent value="account-login-logs"/, "Account page should render a dedicated login log tab content");
  assertNotContains("src/pages/AccountPage.tsx", /<a href="#account-api">个人 API<\/a>/, "Account page should no longer use anchor-only section links");
  assertContains("src/components/ui/Tabs.tsx", /children\?: ReactNode;/, "Tabs should support rendering nested tab content");
  assertContains("src/components/ui/Tabs.tsx", /export function Tabs<[\s\S]*children[\s\S]*<RadixTabs\.Root[\s\S]*\{children \? <div className=\{cn\(\"mt-4\", contentClassName\)\}>\{children\}<\/div> : null\}/, "Tabs should render optional tab content within the same Radix root");

  assertContains("src/styles/pages.css", /\.account-tabs\s*\{/, "Account tabs should have dedicated styles");
  assertContains("src/styles/pages.css", /\.account-tab-content\s*\{/, "Account tab content should have dedicated styles");
  assertContains("package.json", /"test:account-tabs-fix":\s*"node scripts\/verify-account-tabs-fix\.mjs"/, "package script should expose the account tabs verifier");
}

try {
  main();
  console.log("Account tabs verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
