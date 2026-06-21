import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: "chromium-laptop",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: "chromium-tablet",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 768, height: 1024 }
      }
    },
    {
      name: "chromium-mobile",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        viewport: { width: 390, height: 844 },
        isMobile: true
      }
    }
  ],
  webServer: {
    command: "pnpm build && pnpm preview --host 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
