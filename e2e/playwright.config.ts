import { defineConfig, devices } from "@playwright/test";

/**
 * BairroNow Playwright config — targets live production by default.
 * Override with BAIRRONOW_WEB_URL / BAIRRONOW_API_URL env vars for staging.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BAIRRONOW_WEB_URL || "https://bairronow.com.br",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
