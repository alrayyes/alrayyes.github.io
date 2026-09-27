import { defineConfig, devices } from "@playwright/test";

// A fully static page with a single route and nothing dynamic on it — no
// wrangler/workerd stability concerns the way this account's other Astro
// sites have, so this serves the real build through `astro preview`.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["list"], ["junit", { outputFile: "playwright-report/junit.xml" }]]
    : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "bun run build && bun run preview",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    // Astro 7's `preview` auto-detects an agent (Claude Code, CI runners
    // with certain env vars set) and silently daemonizes instead of
    // staying in the foreground — Playwright then sees the parent process
    // exit immediately and reports "exited early" even though the server
    // is actually still running in the background. This opts back into
    // foreground mode, which is what Playwright's own process management
    // expects.
    env: { ASTRO_PREVIEW_BACKGROUND: "1" },
  },
});
