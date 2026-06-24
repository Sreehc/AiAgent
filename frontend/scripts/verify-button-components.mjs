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
  assertContains("src/components/ui/Button.tsx", /lg:\s*"h-11\b/, "Button should support the lg 44px size");
  assertContains("src/components/ui/Button.tsx", /active:translate-y-px/, "Button should include pressed translate feedback");
  assertContains("src/components/ui/Button.tsx", /active:scale-\[0\.99\]/, "Button should include pressed scale feedback");
  assertContains("src/components/ui/Button.tsx", /disabled:active:translate-y-0/, "Button disabled state should cancel active translate feedback");
  assertContains("src/components/ui/Button.tsx", /focus-visible:ring-destructive/, "Danger buttons should use a danger focus ring");
  assertContains("src/components/ui/Button.tsx", /aria-busy=\{loading \|\| undefined\}/, "Button loading state should expose aria-busy");
  assertContains("src/components/ui/Button.tsx", /disabled=\{disabled \|\| loading\}/, "Button loading state should disable repeat submission");
  assertContains("src/components/ui/Button.tsx", /useLayoutEffect/, "Button should measure width to avoid loading layout jumps");
  assertContains("src/components/ui/Button.tsx", /minWidth:\s*loadingWidth/, "Button should preserve measured width while loading");

  assertContains("src/components/ui/IconButton.tsx", /loading\?:\s*boolean/, "IconButton should support a loading state");
  assertContains("src/components/ui/IconButton.tsx", /size\?:\s*"md" \| "lg"/, "IconButton should expose md and lg sizes");
  assertContains("src/components/ui/IconButton.tsx", /md:\s*"h-10 w-10 min-h-10 min-w-10"/, "IconButton md size should be at least 40x40px");
  assertContains("src/components/ui/IconButton.tsx", /lg:\s*"h-11 w-11 min-h-11 min-w-11"/, "IconButton lg size should be at least 44x44px");
  assertContains("src/components/ui/IconButton.tsx", /active:scale-\[0\.96\]/, "IconButton should include pressed scale feedback");
  assertContains("src/components/ui/IconButton.tsx", /disabled:active:scale-100/, "IconButton disabled state should cancel active scale feedback");
  assertContains("src/components/ui/IconButton.tsx", /aria-label=\{label\}/, "IconButton should set aria-label from the required label");
  assertContains("src/components/ui/IconButton.tsx", /aria-busy=\{loading \|\| undefined\}/, "IconButton loading state should expose aria-busy");
  assertContains("src/components/ui/IconButton.tsx", /disabled=\{disabled \|\| loading\}/, "IconButton loading state should disable repeated clicks");
  assertContains("src/components/ui/IconButton.tsx", /animate-spin/, "IconButton loading state should render a spinner");
}

try {
  main();
  console.log("Button component verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
