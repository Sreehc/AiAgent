import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tokensCss = readFileSync(resolve(rootDir, "src/styles/tokens.css"), "utf8");
const themeCss = readFileSync(resolve(rootDir, "src/styles/theme.css"), "utf8");

const expectedTokens = {
  light: {
    "--color-bg": "#f7f8fa",
    "--color-bg-strong": "#eef1f4",
    "--color-surface": "#ffffff",
    "--color-surface-subtle": "#f2f4f7",
    "--color-surface-raised": "#ffffff",
    "--color-surface-inset": "#eaedf1",
    "--color-overlay": "rgba(12, 15, 19, 0.48)",
    "--color-text": "#111318",
    "--color-text-muted": "#525866",
    "--color-text-soft": "#7b8190",
    "--color-text-inverse": "#f8fafc",
    "--color-border": "#d9dee7",
    "--color-border-strong": "#b6bfcc",
    "--color-border-soft": "#e8ebf0",
    "--color-primary": "#0891b2",
    "--color-primary-hover": "#0e7490",
    "--color-primary-soft": "#cffafe",
    "--color-primary-subtle": "#ecfeff",
    "--color-accent": "#0d9488",
    "--color-accent-hover": "#0f766e",
    "--color-accent-soft": "#ccfbf1",
    "--color-success": "#15803d",
    "--color-success-soft": "#dcfce7",
    "--color-warning": "#b45309",
    "--color-warning-soft": "#fef3c7",
    "--color-danger": "#dc2626",
    "--color-danger-soft": "#fee2e2",
    "--color-info": "#2563eb",
    "--color-info-soft": "#dbeafe",
    "--color-running": "#0891b2",
    "--color-running-soft": "#cffafe",
    "--color-paused": "#7c3aed",
    "--color-paused-soft": "#ede9fe",
    "--color-neutral": "#525866",
    "--color-neutral-soft": "#f2f4f7"
  },
  dark: {
    "--color-bg": "#0c0f13",
    "--color-bg-strong": "#11161c",
    "--color-surface": "#151a21",
    "--color-surface-subtle": "#1b222b",
    "--color-surface-raised": "#1e2630",
    "--color-surface-inset": "#0f141a",
    "--color-overlay": "rgba(0, 0, 0, 0.64)",
    "--color-text": "#f1f5f9",
    "--color-text-muted": "#a8b1bf",
    "--color-text-soft": "#768194",
    "--color-text-inverse": "#062936",
    "--color-border": "#2a3340",
    "--color-border-strong": "#3a4655",
    "--color-border-soft": "#202833",
    "--color-primary": "#22d3ee",
    "--color-primary-hover": "#67e8f9",
    "--color-primary-soft": "#123744",
    "--color-primary-subtle": "#0e2730",
    "--color-accent": "#5eead4",
    "--color-accent-hover": "#99f6e4",
    "--color-accent-soft": "#113a35",
    "--color-success": "#4ade80",
    "--color-success-soft": "#10291c",
    "--color-warning": "#fbbf24",
    "--color-warning-soft": "#35260a",
    "--color-danger": "#f87171",
    "--color-danger-soft": "#3b1215",
    "--color-info": "#93c5fd",
    "--color-info-soft": "#14213f",
    "--color-running": "#22d3ee",
    "--color-running-soft": "#123744",
    "--color-paused": "#c4b5fd",
    "--color-paused-soft": "#241a3f",
    "--color-neutral": "#a8b1bf",
    "--color-neutral-soft": "#1b222b"
  }
};

const expectedThemeBridge = {
  light: {
    "--background": "220 23% 98%",
    "--foreground": "225 17% 8%",
    "--card": "0 0% 100%",
    "--card-foreground": "225 17% 8%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "225 17% 8%",
    "--primary": "191 92% 36%",
    "--primary-foreground": "210 40% 98%",
    "--secondary": "220 24% 95%",
    "--secondary-foreground": "225 17% 8%",
    "--muted": "220 24% 95%",
    "--muted-foreground": "223 11% 36%",
    "--accent": "183 100% 96%",
    "--accent-foreground": "191 82% 24%",
    "--border": "219 22% 88%",
    "--input": "219 22% 88%",
    "--ring": "191 92% 36%"
  },
  dark: {
    "--background": "216 23% 6%",
    "--foreground": "210 40% 96%",
    "--card": "217 22% 11%",
    "--card-foreground": "210 40% 96%",
    "--popover": "216 23% 15%",
    "--popover-foreground": "210 40% 96%",
    "--primary": "188 86% 53%",
    "--primary-foreground": "194 80% 12%",
    "--secondary": "216 23% 15%",
    "--secondary-foreground": "210 40% 96%",
    "--muted": "216 23% 15%",
    "--muted-foreground": "218 15% 70%",
    "--accent": "192 55% 12%",
    "--accent-foreground": "188 86% 76%",
    "--border": "215 21% 21%",
    "--input": "215 21% 21%",
    "--ring": "188 86% 53%"
  }
};

function normalize(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractRule(css, selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`));
  if (!match) {
    throw new Error(`Missing CSS rule for ${selector}`);
  }
  return match[1];
}

function parseDeclarations(block) {
  const declarations = new Map();
  const declarationRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match;
  while ((match = declarationRegex.exec(block)) !== null) {
    declarations.set(match[1], normalize(match[2]));
  }
  return declarations;
}

function assertDeclarations(scope, actual, expected) {
  for (const [name, expectedValue] of Object.entries(expected)) {
    const actualValue = actual.get(name);
    if (!actualValue) {
      throw new Error(`${scope}: missing ${name}`);
    }
    if (actualValue !== normalize(expectedValue)) {
      throw new Error(`${scope}: ${name} expected ${expectedValue}, received ${actualValue}`);
    }
  }
}

function main() {
  const tokenRoot = parseDeclarations(extractRule(tokensCss, ":root"));
  const tokenDark = parseDeclarations(extractRule(tokensCss, ".dark"));
  assertDeclarations("tokens.css :root", tokenRoot, expectedTokens.light);
  assertDeclarations("tokens.css .dark", tokenDark, expectedTokens.dark);

  const themeRoot = parseDeclarations(extractRule(themeCss, ":root"));
  const themeDark = parseDeclarations(extractRule(themeCss, ".dark"));
  assertDeclarations("theme.css :root", themeRoot, expectedThemeBridge.light);
  assertDeclarations("theme.css .dark", themeDark, expectedThemeBridge.dark);
}

try {
  main();
  console.log("Theme token verification passed.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
