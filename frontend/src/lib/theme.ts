export type ResolvedTheme = "light" | "dark";
export type ThemePreference = "system" | ResolvedTheme;

export const THEME_STORAGE_KEY = "aiagent.theme";
export const THEME_QUERY = "(prefers-color-scheme: dark)";

type ThemeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type ThemeMatchMedia = (query: string) => Pick<MediaQueryList, "matches">;
type ThemeRoot = Pick<HTMLElement, "classList" | "dataset">;

type ThemeRuntimeOptions = {
  storage?: ThemeStorage;
  matchMedia?: ThemeMatchMedia;
  root?: ThemeRoot;
};

function getStorage(storage?: ThemeStorage): ThemeStorage | null {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getMatchMedia(matchMedia?: ThemeMatchMedia): ThemeMatchMedia | null {
  if (matchMedia) return matchMedia;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia.bind(window);
}

function getRoot(root?: ThemeRoot): ThemeRoot | null {
  if (root) return root;
  if (typeof document === "undefined") return null;
  return document.documentElement;
}

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemePreference(storage?: ThemeStorage): ThemePreference {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return "system";

  const stored = targetStorage.getItem(THEME_STORAGE_KEY);
  if (isThemePreference(stored)) {
    return stored;
  }

  if (stored !== null) {
    targetStorage.removeItem(THEME_STORAGE_KEY);
  }
  return "system";
}

export function persistThemePreference(preference: ThemePreference, storage?: ThemeStorage) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  if (preference === "system") {
    targetStorage.removeItem(THEME_STORAGE_KEY);
    return;
  }

  targetStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function getSystemTheme(matchMedia?: ThemeMatchMedia): ResolvedTheme {
  const targetMatchMedia = getMatchMedia(matchMedia);
  return targetMatchMedia?.(THEME_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function applyTheme(theme: ResolvedTheme, root?: ThemeRoot) {
  const targetRoot = getRoot(root);
  if (!targetRoot) return;

  targetRoot.classList.toggle("dark", theme === "dark");
  targetRoot.dataset.theme = theme;
}

export function initializeTheme(options: ThemeRuntimeOptions = {}) {
  const preference = readThemePreference(options.storage);
  const systemTheme = getSystemTheme(options.matchMedia);
  const theme = resolveTheme(preference, systemTheme);

  applyTheme(theme, options.root);
  return { preference, systemTheme, theme };
}
