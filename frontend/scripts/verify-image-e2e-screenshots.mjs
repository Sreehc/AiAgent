import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readProjectFile(path) {
  return readFileSync(resolve(rootDir, path), "utf8");
}

function assertExists(path, message) {
  if (!existsSync(resolve(rootDir, path))) {
    throw new Error(`${path}: ${message}`);
  }
}

function assertContains(filePath, pattern, message) {
  const content = readProjectFile(filePath);
  if (!pattern.test(content)) {
    throw new Error(`${filePath}: ${message}`);
  }
}

function main() {
  assertContains("package.json", /"test:image-e2e-screenshots":\s*"node scripts\/verify-image-e2e-screenshots\.mjs"/, "package script should expose the T06 verifier");

  assertExists("e2e/image.spec.ts", "Image studio E2E screenshot spec should exist");
  assertContains("e2e/image.spec.ts", /from\s+["']\.\/fixtures\/test["']/, "image spec should use authenticated mock fixtures");
  assertContains("e2e/image.spec.ts", /from\s+["']\.\/fixtures\/imageScenarios["']/, "image spec should use dedicated image scenarios");
  assertContains("e2e/image.spec.ts", /IMAGE_STATES/, "image spec should define screenshot states");
  assertContains("e2e/image.spec.ts", /empty/, "image spec should cover empty state");
  assertContains("e2e/image.spec.ts", /history/, "image spec should cover history gallery state");
  assertContains("e2e/image.spec.ts", /selection/, "image spec should cover batch selection state");
  assertContains("e2e/image.spec.ts", /compare/, "image spec should cover compare state");
  assertContains("e2e/image.spec.ts", /download/, "image spec should cover download fallback or feedback state");
  assertContains("e2e/image.spec.ts", /\/workspace\/image-generation/, "image spec should visit the image studio route");
  assertContains("e2e/image.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']选择["'],\s*exact:\s*true\s*\}\)\.click\(\)/, "image spec should enter batch selection mode");
  assertContains("e2e/image.spec.ts", /getByLabel\(["']选择图片/, "image spec should select images through accessible checkboxes");
  assertContains("e2e/image.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']收藏图片["']\s*\}\)/, "image spec should toggle favorites");
  assertContains("e2e/image.spec.ts", /reload\(\)/, "image spec should verify favorite persistence after reload");
  assertContains("e2e/image.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']对比图片["']\s*\}\)\.click\(\)/, "image spec should open compare dialog");
  assertContains("e2e/image.spec.ts", /超过 4 张时仅展示前 4 张/, "image spec should verify compare overflow boundary");
  assertContains("e2e/image.spec.ts", /getByRole\(["']button["'],\s*\{\s*name:\s*["']下载集合["']\s*\}\)\.click\(\)/, "image spec should run download collection");
  assertContains("e2e/image.spec.ts", /部分图片无法直接下载|已开始下载/, "image spec should verify download feedback");
  assertContains("e2e/image.spec.ts", /toHaveScreenshot|toMatchSnapshot/, "image spec should capture screenshots");
  assertContains("e2e/image.spec.ts", /image\/\$\{state\.slug\}\.png/, "image screenshots should be grouped by image state");

  assertExists("e2e/fixtures/imageScenarios.ts", "Image scenario fixtures should exist");
  assertContains("e2e/fixtures/imageScenarios.ts", /imageScenarios/, "image scenario fixtures should export scenario data");
  assertContains("e2e/fixtures/imageScenarios.ts", /empty/, "image scenarios should include empty state data");
  assertContains("e2e/fixtures/imageScenarios.ts", /history/, "image scenarios should include history data");
  assertContains("e2e/fixtures/imageScenarios.ts", /setupImageScenario/, "image scenario fixtures should provide a setup helper");
  assertContains("e2e/fixtures/imageScenarios.ts", /page\.route\(["']\*\*\/api\/v1\/images/, "image scenario setup should override image API calls");
  assertContains("e2e/fixtures/imageScenarios.ts", /data:image\/svg\+xml/, "image scenarios should use stable inline image assets");

  assertContains("../docs/tasks.md", /\| T06 \| 已完成 \|[\s\S]*image\.spec\.ts[\s\S]*批量选择[\s\S]*收藏[\s\S]*对比[\s\S]*下载集合/, "docs/tasks.md should record T06 completion");
}

try {
  main();
  console.log("Image studio E2E screenshot verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
