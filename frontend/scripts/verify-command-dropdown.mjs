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
  assertContains("src/components/ui/DropdownMenu.tsx", /selected\?:\s*boolean/, "Dropdown items should support selected state");
  assertContains("src/components/ui/DropdownMenu.tsx", /type:\s*"separator"/, "Dropdown should support separator items");
  assertContains("src/components/ui/DropdownMenu.tsx", /type:\s*"group"/, "Dropdown should support grouped items");
  assertContains("src/components/ui/DropdownMenu.tsx", /RadixMenu\.Separator/, "Dropdown should render Radix separators");
  assertContains("src/components/ui/DropdownMenu.tsx", /RadixMenu\.Label/, "Dropdown groups should render labels");
  assertContains("src/components/ui/DropdownMenu.tsx", /Check/, "Selected dropdown items should show a check icon or leading indicator");
  assertContains("src/components/ui/DropdownMenu.tsx", /data-selected=\{item\.selected \|\| undefined\}/, "Selected dropdown items should expose data-selected");
  assertContains("src/components/ui/DropdownMenu.tsx", /aria-current=\{item\.selected \? "true" : undefined\}/, "Selected dropdown items should expose aria-current");
  assertContains("src/components/ui/DropdownMenu.tsx", /min-h-10 sm:min-h-8/, "Dropdown items should keep mobile and desktop hit targets");
  assertContains("src/components/ui/DropdownMenu.tsx", /data-\[highlighted\]:bg-muted/, "Highlighted dropdown items should have visible keyboard focus");
  assertContains("src/components/ui/DropdownMenu.tsx", /data-\[disabled\]:opacity-50/, "Disabled dropdown items should remain readable but clearly disabled");
  assertContains("src/components/ui/DropdownMenu.tsx", /item\.tone === "danger"/, "Dropdown should support danger item styling");
  assertContains("src/components/ui/DropdownMenu.tsx", /暂无可用操作/, "Empty dropdowns should render a disabled empty item");

  assertContains("src/components/command/CommandPalette.tsx", /const \[search,\s*setSearch\]/, "CommandPalette should track the search term for stable empty state copy");
  assertContains("src/components/command/CommandPalette.tsx", /const \[error,\s*setError\]/, "CommandPalette should expose command execution errors");
  assertContains("src/components/command/CommandPalette.tsx", /<Alert tone="error"/, "CommandPalette should render command errors as an Alert");
  assertContains("src/components/command/CommandPalette.tsx", /value=\{search\}/, "Command input should be controlled by search state");
  assertContains("src/components/command/CommandPalette.tsx", /onValueChange=\{setSearch\}/, "Command input should update search state");
  assertContains("src/components/command/CommandPalette.tsx", /没有匹配的命令/, "CommandPalette should render a clear empty result state");
  assertContains("src/components/command/CommandPalette.tsx", /search\.trim\(\)/, "Empty state should preserve or reference the current search term");
  assertContains("src/components/command/CommandPalette.tsx", /availableCommands/, "CommandPalette should explicitly filter available commands");
  assertContains("src/components/command/CommandPalette.tsx", /!command\.adminOnly \|\| isAdmin/, "CommandPalette should hide admin-only commands from non-admin users");
  assertContains("src/components/command/CommandPalette.tsx", /Command\.Group/, "CommandPalette should keep commands grouped");
  assertContains("src/components/command/CommandPalette.tsx", /data-\[selected=true\]:bg-primary\/10/, "Selected command item should use the primary subtle state");
  assertContains("src/components/command/CommandPalette.tsx", /data-\[selected=true\]:text-primary/, "Selected command item text should visibly change");
  assertContains("src/components/command/CommandPalette.tsx", /max-h-80 overflow-y-auto/, "Command results should remain scrollable and stable while searching");
  assertContains("src/components/command/CommandPalette.tsx", /bg-\[var\(--color-overlay\)\]/, "Command overlay should use the semantic overlay token");
  assertContains("src/components/command/CommandPalette.tsx", /try\s*\{[\s\S]*runCommand/, "Command execution should be wrapped to surface failures");

  assertContains("src/components/shell/UserMenu.tsx", /type:\s*"group"/, "UserMenu should exercise grouped dropdown items");
  assertContains("src/components/shell/UserMenu.tsx", /selected:\s*true/, "UserMenu should show the current account item as selected");
  assertContains("src/components/shell/UserMenu.tsx", /type:\s*"separator"/, "UserMenu should separate danger actions");

  assertContains("package.json", /"test:command-dropdown":\s*"node scripts\/verify-command-dropdown\.mjs"/, "package script should expose the C08 verifier");
}

try {
  main();
  console.log("Command and dropdown verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
