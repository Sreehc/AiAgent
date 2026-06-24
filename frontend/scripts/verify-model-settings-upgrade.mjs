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
  assertContains("src/pages/AdminSettingsPage.tsx", /const modelSummary = buildModelSummary\(models\)/, "Admin settings should derive a model summary");
  assertContains("src/pages/AdminSettingsPage.tsx", /className="model-settings-summary"/, "Admin settings should render summary cards");
  assertContains("src/pages/AdminSettingsPage.tsx", /model-settings-summary__card/, "Admin settings summary should use stable card hooks");
  assertContains("src/pages/AdminSettingsPage.tsx", /modelSummary\.defaultModel/, "Default model should be highlighted in the page summary");
  assertContains("src/pages/AdminSettingsPage.tsx", /modelSummary\.riskyModels\.length/, "Risky models should be counted in the page summary");
  assertContains("src/pages/AdminSettingsPage.tsx", /model\.riskLevel !== "default"/, "Backend risk level should drive risky model counting");
  assertContains("src/pages/AdminSettingsPage.tsx", /model\.riskCodes\.includes\("LAST_TEST_FAILED"\)/, "Backend risk codes should drive failed-test summary");
  assertContains("src/pages/AdminSettingsPage.tsx", /检测到模型风险配置/, "Admin settings should show a clear risk alert");
  assertContains("src/pages/AdminSettingsPage.tsx", /默认模型未设置/, "Admin settings should warn when no default model is configured");

  assertContains("src/features/system/ModelRegistry.tsx", /type ModelRiskLevel = "default" \| "warning" \| "danger"/, "Model registry should classify row risk levels");
  assertContains("src/features/system/ModelRegistry.tsx", /function getModelRiskLevel\(model: ModelConfigItem\)/, "Model registry should have a risk helper");
  assertContains("src/features/system/ModelRegistry.tsx", /return model\.riskLevel/, "Model registry should use backend risk level");
  assertContains("src/features/system/ModelRegistry.tsx", /model\.riskReasons\[0\]/, "Model registry should show backend risk reason when available");
  assertContains("src/features/system/ModelRegistry.tsx", /className="model-registry-group"/, "Model registry groups should have stable styles");
  assertContains("src/features/system/ModelRegistry.tsx", /className="model-registry-row"/, "Model registry rows should have stable styles");
  assertContains("src/features/system/ModelRegistry.tsx", /className="model-registry-model"/, "Model column should be structured");
  assertContains("src/features/system/ModelRegistry.tsx", /className="model-registry-provider"/, "Provider column should be structured");
  assertContains("src/features/system/ModelRegistry.tsx", /className="model-registry-test"/, "Test status column should be structured");
  assertContains("src/features/system/ModelRegistry.tsx", /data-risk=\{getModelRiskLevel\(model\)\}/, "Model rows should expose risk state");
  assertContains("src/features/system/ModelRegistry.tsx", /model\.defaultModel \? <Badge tone="primary">默认<\/Badge>/, "Default model should have an explicit badge");
  assertContains("src/features/system/ModelRegistry.tsx", /StatusPill status=\{model\.lastTestStatus \?\? "UNKNOWN"\}/, "Last test status should use StatusPill");
  assertContains("src/features/system/ModelRegistry.tsx", /model\.lastTestedAt/, "Last tested time should be visible when available");
  assertContains("src/features/system/ModelRegistry.tsx", /onToggle\(model\)/, "Enable/disable action should remain wired");
  assertContains("src/features/system/ModelRegistry.tsx", /onDefault\(model\)/, "Default action should remain wired");
  assertContains("src/features/system/ModelRegistry.tsx", /onTest\(model\)/, "Test action should remain wired");

  assertContains("src/styles/pages.css", /\.model-settings-summary\s*\{/, "Model summary should have dedicated styles");
  assertContains("src/styles/pages.css", /\.model-settings-summary__card\s*\{/, "Model summary cards should have dedicated styles");
  assertContains("src/styles/pages.css", /\.model-registry-group\s*\{/, "Model registry groups should have dedicated styles");
  assertContains("src/styles/pages.css", /\.model-registry-row\s*\{/, "Model registry rows should have dedicated styles");
  assertContains("src/styles/pages.css", /\.model-registry-row\[data-risk="warning"\]/, "Warning model rows should be styled");
  assertContains("src/styles/pages.css", /\.model-registry-row\[data-risk="danger"\]/, "Danger model rows should be styled");
  assertContains("src/styles/pages.css", /\.model-registry-test\s*\{/, "Model test status should have dedicated styles");

  assertContains("package.json", /"test:model-settings-upgrade":\s*"node scripts\/verify-model-settings-upgrade\.mjs"/, "package script should expose the A02 verifier");
  assertContains("../docs/tasks.md", /\| A02 \| 已完成 \|[\s\S]*AdminSettingsPage[\s\S]*ModelRegistry[\s\S]*默认模型和异常 provider 明确[\s\S]*模型启停\/测试不回归/, "docs/tasks.md should record A02 completion");
}

try {
  main();
  console.log("Model settings upgrade verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
