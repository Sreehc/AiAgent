import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themeModulePath = resolve(rootDir, "src/lib/theme.ts");
const useThemePath = resolve(rootDir, "src/hooks/useTheme.ts");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadThemeModule() {
  const source = readFileSync(themeModulePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: themeModulePath
  });

  const module = { exports: {} };
  vm.runInNewContext(outputText, { exports: module.exports, module }, { filename: "theme.cjs" });
  return module.exports;
}

function createStorage(initialValue) {
  const values = new Map();
  if (initialValue !== undefined) {
    values.set("aiagent.theme", initialValue);
  }
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    snapshot: () => Object.fromEntries(values)
  };
}

function createRoot() {
  const classes = new Set();
  return {
    dataset: {},
    classList: {
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        if (force) classes.add(name);
        else classes.delete(name);
      }
    }
  };
}

function matchMediaFor(matches) {
  return () => ({ matches });
}

function runBehaviorChecks(theme) {
  const storage = createStorage();
  assert(theme.readThemePreference(storage) === "system", "Missing storage must resolve to system preference");

  theme.persistThemePreference("dark", storage);
  assert(storage.snapshot()["aiagent.theme"] === "dark", "Manual dark preference must be persisted");
  assert(theme.readThemePreference(storage) === "dark", "Stored dark preference must be read back");

  theme.persistThemePreference("system", storage);
  assert(!("aiagent.theme" in storage.snapshot()), "System preference must clear persisted override");

  const invalidStorage = createStorage("solarized");
  assert(theme.readThemePreference(invalidStorage) === "system", "Invalid stored preference must fall back to system");
  assert(!("aiagent.theme" in invalidStorage.snapshot()), "Invalid stored preference must be removed");

  assert(theme.resolveTheme("system", "dark") === "dark", "System preference must resolve to dark system theme");
  assert(theme.resolveTheme("system", "light") === "light", "System preference must resolve to light system theme");
  assert(theme.resolveTheme("light", "dark") === "light", "Manual light must override dark system theme");
  assert(theme.resolveTheme("dark", "light") === "dark", "Manual dark must override light system theme");

  const darkRoot = createRoot();
  const darkResult = theme.initializeTheme({
    storage: createStorage(),
    matchMedia: matchMediaFor(true),
    root: darkRoot
  });
  assert(darkResult.preference === "system", "Initial missing storage preference must be system");
  assert(darkResult.theme === "dark", "Initial missing storage must follow dark system theme");
  assert(darkRoot.classList.contains("dark"), "Dark system theme must add the dark class");
  assert(darkRoot.dataset.theme === "dark", "Applied dark theme must be exposed on dataset.theme");

  const lightRoot = createRoot();
  const lightResult = theme.initializeTheme({
    storage: createStorage("light"),
    matchMedia: matchMediaFor(true),
    root: lightRoot
  });
  assert(lightResult.preference === "light", "Manual light preference must be returned");
  assert(lightResult.theme === "light", "Manual light preference must override dark system theme");
  assert(!lightRoot.classList.contains("dark"), "Manual light preference must remove the dark class");
}

function runHookSourceChecks() {
  const source = readFileSync(useThemePath, "utf8");
  assert(source.includes("ThemePreference"), "useTheme must expose explicit theme preference state");
  assert(source.includes("systemTheme"), "useTheme must track the current system theme");
  assert(
    source.includes("addEventListener(\"change\"") || source.includes("addListener("),
    "useTheme must subscribe to prefers-color-scheme changes"
  );
  assert(source.includes("persistThemePreference"), "useTheme must persist manual theme preferences");
}

try {
  runBehaviorChecks(loadThemeModule());
  runHookSourceChecks();
  console.log("Theme behavior verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
